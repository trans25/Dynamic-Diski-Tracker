using System.Text;
using Diskie.API.Authorization;
using Diskie.API.Configuration;
using Diskie.API.Middleware;
using Diskie.API.Security;
using Diskie.API.Seeding;
using Diskie.API.Services;
using Diskie.API.Services.Coach;
using Diskie.API.Services.Metrics;
using Diskie.DataAccess.Contracts;
using Diskie.DataAccess.Model.DbModels;
using Diskie.DataAccess.Model.Models.Enums;
using Diskie.DataAccess.Repository;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

// PostgreSQL data source with dynamic JSON enabled (required for jsonb columns
// that map to POCO/collection types such as SportTemplate.AssessmentMetrics).
var dataSourceBuilder = new NpgsqlDataSourceBuilder(builder.Configuration.GetConnectionString("DefaultConnection"));
dataSourceBuilder.EnableDynamicJson();
var dataSource = dataSourceBuilder.Build();


builder.Services.AddDbContext<DiskiDbContext>(options =>
    options.UseNpgsql(dataSource));

// ASP.NET Identity (Core only, so JWT bearer remains the default auth scheme)
builder.Services
    .AddIdentityCore<User>(options =>
    {
        options.Password.RequiredLength = 8;
        options.Password.RequireNonAlphanumeric = false;
        options.User.RequireUniqueEmail = true;
        options.SignIn.RequireConfirmedAccount = false;
    })
    .AddRoles<IdentityRole<Guid>>()
    .AddEntityFrameworkStores<DiskiDbContext>()
    .AddDefaultTokenProviders();

// Strongly-typed JWT settings
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));
var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>() ?? new JwtSettings();

// Honor X-Forwarded-Proto/-For from the Azure edge (Front Door / App Service) so
// Request.IsHttps, HTTPS redirection, HSTS emission, and secure cookies work
// correctly behind TLS-terminating reverse proxies.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedFor;
    // App Service/Front Door inject these; clear the default loopback-only
    // restriction since the proxy is not on the loopback network.
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

// HSTS hardening: long max-age with subdomains, per Azure baseline.
builder.Services.AddHsts(options =>
{
    options.MaxAge = TimeSpan.FromDays(365);
    options.IncludeSubDomains = true;
});

// Authentication (JWT Bearer)
builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey)),
            ClockSkew = TimeSpan.Zero
        };
    });

// Authorization policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(AuthorizationPolicies.SuperAdminOnly, policy =>
        policy.RequireRole(nameof(UserRole.SuperAdmin)));

    options.AddPolicy(AuthorizationPolicies.PlatformManagement, policy =>
        policy.RequireRole(nameof(UserRole.SuperAdmin), nameof(UserRole.SchoolAdmin)));

    options.AddPolicy(AuthorizationPolicies.CoachOnly, policy =>
        policy.RequireRole(nameof(UserRole.Coach)));
});

// CORS for the React (MUI) Super Admin frontend (Diskie.WebAdmin.Mui).
const string FrontendCorsPolicy = "FrontendCorsPolicy";
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? new[] { "http://localhost:5173", "http://localhost:5174" };

builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy =>
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod());
});

// Data access
builder.Services.AddScoped<IRepositoryWrapper, RepositoryWrapper>();

// Request context (tenant/user scope from JWT claims)
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserContext, CurrentUserContext>();

// Application services
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAdminSportService, AdminSportService>();
builder.Services.AddScoped<ISuperAdminService, SuperAdminService>();
builder.Services.AddScoped<ITenantService, TenantService>();
builder.Services.AddScoped<IAdminUserService, AdminUserService>();
builder.Services.AddScoped<ITemplateService, TemplateService>();
builder.Services.AddScoped<IBillingService, BillingService>();
builder.Services.AddScoped<IHealthService, HealthService>();
builder.Services.AddScoped<ICoachService, CoachService>();
builder.Services.AddScoped<ICoachInsightsService, CoachInsightsService>();
builder.Services.AddScoped<ICoachOperationsService, CoachOperationsService>();
builder.Services.AddScoped<IMilestoneService, MilestoneService>();
builder.Services.AddScoped<IMetricsService, MetricsService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Swagger with JWT support
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Diskie Super Admin API",
        Version = "v1",
        Description = "Platform-level Super Admin module for the Dynamic Diski Tracker."
    });

    var securityScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "Enter the JWT token with the 'Bearer ' prefix, e.g. 'Bearer eyJ...'",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    };

    options.AddSecurityDefinition(JwtBearerDefaults.AuthenticationScheme, securityScheme);
    options.AddSecurityRequirement(_ => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference(JwtBearerDefaults.AuthenticationScheme),
            new List<string>()
        }
    });
});

var app = builder.Build();

// Apply pending EF Core migrations on startup
using (var migrationScope = app.Services.CreateScope())
{
    var migrationContext = migrationScope.ServiceProvider.GetRequiredService<DiskiDbContext>();
    await migrationContext.Database.MigrateAsync();
}

// Apply forwarded headers first so the scheme/IP from the Azure edge (Front Door /
// App Service) is applied before any middleware reads Request.IsHttps or the
// client IP. Must precede exception handling, HTTPS redirection, and HSTS.
app.UseForwardedHeaders();

// Global exception handling
app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();

    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<DiskiDbContext>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
    await CoachModuleSeeder.SeedAsync(dbContext, userManager, roleManager);
}
else
{
    // Production: enforce TLS. HSTS instructs browsers to use HTTPS only
    // (max-age=31536000; includeSubDomains per the Azure hardening baseline),
    // and redirection upgrades any plain-HTTP request. HTTPS redirection is
    // skipped in Development because the 'http' launch profile binds http only,
    // so redirecting would strip the Authorization header on the http->https
    // hop and break JWT auth.
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseCors(FrontendCorsPolicy);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
