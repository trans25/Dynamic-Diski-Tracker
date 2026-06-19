# Parent Magic-Link Backend Blueprint (ASP.NET Core + Identity)

This blueprint matches the frontend flow that is already implemented:

1. Parent submits Child ID (no password)
2. API generates a short-lived magic link token
3. Local dev logs the link to console
4. Parent opens link
5. API exchanges token for JWT
6. JWT includes ChildId claim
7. Data is scoped by ChildId on all parent endpoints

## 1) view models

```csharp
public sealed class ParentMagicLinkRequest
{
    public string ChildIdNumber { get; init; } = string.Empty;
}

public sealed class ParentMagicLinkResponse
{
    public string? MagicLink { get; init; }
    public DateTimeOffset ExpiresAtUtc { get; init; }
}

public sealed class ParentMagicTokenExchangeRequest
{
    public string Token { get; init; } = string.Empty;
}

public sealed class ParentAuthResponse
{
    public string AccessToken { get; init; } = string.Empty;
    public DateTimeOffset ExpiresAtUtc { get; init; }
}
```

## 2) One-time token persistence model

Use a small table so tokens are one-time and auditable.

```csharp
public sealed class ParentMagicLoginToken
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;
    public string ChildIdNumber { get; set; } = string.Empty;
    public string TokenHash { get; set; } = string.Empty;
    public DateTimeOffset ExpiresAtUtc { get; set; }
    public DateTimeOffset? ConsumedAtUtc { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public string? CreatedByIp { get; set; }
}
```

Hash helper:

```csharp
using System.Security.Cryptography;
using System.Text;

public static class TokenHash
{
    public static string Sha256(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes);
    }
}
```

## 3) Service contract

```csharp
public interface IParentMagicLinkService
{
    Task<ParentMagicLinkResponse> RequestMagicLinkAsync(
        ParentMagicLinkRequest request,
        string baseUrl,
        string? requesterIp,
        CancellationToken ct = default);

    Task<ParentAuthResponse> ConsumeMagicTokenAsync(
        ParentMagicTokenExchangeRequest request,
        CancellationToken ct = default);
}
```

## 4) Service implementation (minimal)

```csharp
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

public sealed class ParentMagicLinkService : IParentMagicLinkService
{
    private static readonly TimeSpan MagicTokenLifetime = TimeSpan.FromMinutes(10);

    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly ApplicationDbContext _db;
    private readonly IClock _clock;

    public ParentMagicLinkService(
        UserManager<ApplicationUser> userManager,
        IJwtTokenService jwtTokenService,
        ApplicationDbContext db,
        IClock clock)
    {
        _userManager = userManager;
        _jwtTokenService = jwtTokenService;
        _db = db;
        _clock = clock;
    }

    public async Task<ParentMagicLinkResponse> RequestMagicLinkAsync(
        ParentMagicLinkRequest request,
        string baseUrl,
        string? requesterIp,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.ChildIdNumber))
            throw new ArgumentException("ChildIdNumber is required.");

        var childId = request.ChildIdNumber.Trim();

        // Resolve parent user by childId mapping in your domain model.
        // Replace this with your actual relationship query.
        var user = await _db.Users
            .Where(u => u.ChildIdNumber == childId)
            .SingleOrDefaultAsync(ct);

        // Return success even if not found to avoid account enumeration.
        if (user is null)
        {
            return new ParentMagicLinkResponse
            {
                MagicLink = null,
                ExpiresAtUtc = _clock.UtcNow.Add(MagicTokenLifetime)
            };
        }

        var rawToken = Convert.ToBase64String(Guid.NewGuid().ToByteArray()) + Guid.NewGuid().ToString("N");
        var tokenHash = TokenHash.Sha256(rawToken);
        var expiresAt = _clock.UtcNow.Add(MagicTokenLifetime);

        var row = new ParentMagicLoginToken
        {
            UserId = user.Id,
            ChildIdNumber = childId,
            TokenHash = tokenHash,
            ExpiresAtUtc = expiresAt,
            CreatedByIp = requesterIp
        };

        _db.ParentMagicLoginTokens.Add(row);
        await _db.SaveChangesAsync(ct);

        var encoded = Uri.EscapeDataString(rawToken);
        var magicLink = $"{baseUrl}/parent/magic?token={encoded}";

        // Local dev requirement: print link to console.
        Console.WriteLine($"[PARENT MAGIC LINK] ChildId={childId} Link={magicLink}");

        return new ParentMagicLinkResponse
        {
            MagicLink = magicLink,
            ExpiresAtUtc = expiresAt
        };
    }

    public async Task<ParentAuthResponse> ConsumeMagicTokenAsync(
        ParentMagicTokenExchangeRequest request,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Token))
            throw new ArgumentException("Token is required.");

        var tokenHash = TokenHash.Sha256(request.Token);
        var now = _clock.UtcNow;

        var row = await _db.ParentMagicLoginTokens
            .Where(t => t.TokenHash == tokenHash)
            .SingleOrDefaultAsync(ct);

        if (row is null || row.ConsumedAtUtc != null || row.ExpiresAtUtc <= now)
            throw new UnauthorizedAccessException("Magic link is invalid or expired.");

        var user = await _userManager.FindByIdAsync(row.UserId);
        if (user is null)
            throw new UnauthorizedAccessException("User not found.");

        row.ConsumedAtUtc = now;
        await _db.SaveChangesAsync(ct);

        var childId = row.ChildIdNumber;
        var (accessToken, expiresAtUtc) = _jwtTokenService.CreateParentToken(user, childId);

        return new ParentAuthResponse
        {
            AccessToken = accessToken,
            ExpiresAtUtc = expiresAtUtc
        };
    }
}
```

## 5) JWT service: include ChildId claim

```csharp
using System.Security.Claims;

public interface IJwtTokenService
{
    (string Token, DateTimeOffset ExpiresAtUtc) CreateParentToken(ApplicationUser user, string childId);
}

public sealed class JwtTokenService : IJwtTokenService
{
    public (string Token, DateTimeOffset ExpiresAtUtc) CreateParentToken(ApplicationUser user, string childId)
    {
        var expires = DateTimeOffset.UtcNow.AddHours(1);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(ClaimTypes.Role, "Parent"),
            new("ChildId", childId)
        };

        // Build/sign token with your existing issuer/audience/signing key settings.
        var token = BuildJwt(claims, expires);
        return (token, expires);
    }

    private string BuildJwt(IEnumerable<Claim> claims, DateTimeOffset expires)
    {
        // Your existing JWT creation code here.
        throw new NotImplementedException();
    }
}
```

## 6) Controller endpoints

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/auth/parent/magic-link")]
public sealed class ParentMagicLinkAuthController : ControllerBase
{
    private readonly IParentMagicLinkService _service;

    public ParentMagicLinkAuthController(IParentMagicLinkService service)
    {
        _service = service;
    }

    [HttpPost("request")]
    [AllowAnonymous]
    public async Task<ActionResult<ParentMagicLinkResponse>> Request(
        [FromBody] ParentMagicLinkRequest request,
        CancellationToken ct)
    {
        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        var result = await _service.RequestMagicLinkAsync(request, baseUrl, ip, ct);
        return Ok(result);
    }

    [HttpPost("consume")]
    [AllowAnonymous]
    public async Task<ActionResult<ParentAuthResponse>> Consume(
        [FromBody] ParentMagicTokenExchangeRequest request,
        CancellationToken ct)
    {
        var result = await _service.ConsumeMagicTokenAsync(request, ct);
        return Ok(result);
    }
}
```

## 7) Child-scoped data access

Use claim-based access so client cannot request another child.

```csharp
public interface IChildScopeAccessor
{
    string? ChildId { get; }
}

public sealed class HttpChildScopeAccessor : IChildScopeAccessor
{
    private readonly IHttpContextAccessor _http;

    public HttpChildScopeAccessor(IHttpContextAccessor http)
    {
        _http = http;
    }

    public string? ChildId => _http.HttpContext?.User.FindFirst("ChildId")?.Value;
}
```

In parent controllers:

```csharp
[Authorize(Roles = "Parent")]
[HttpGet("summary")]
public async Task<ActionResult<ChildSummaryDto>> GetSummary(CancellationToken ct)
{
    var childId = User.FindFirst("ChildId")?.Value;
    if (string.IsNullOrWhiteSpace(childId)) return Forbid();

    var data = await _service.GetChildSummaryForParentAsync(childId, ct);
    return Ok(data);
}
```

## 8) DI and setup

```csharp
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IParentMagicLinkService, ParentMagicLinkService>();
builder.Services.AddScoped<IChildScopeAccessor, HttpChildScopeAccessor>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
```

## 9) Security checklist

- Token lifetime 5 to 10 minutes maximum
- Mark tokens as consumed on first successful use
- Hash tokens in DB, never store raw token
- Return generic success on request endpoint (no user enumeration)
- Add rate limiting by Child ID and IP
- Audit all request/consume attempts
- Revoke parent session token on logout/compromise

## 10) Frontend endpoint compatibility

This backend matches your frontend calls:

- POST /api/auth/parent/magic-link/request
- POST /api/auth/parent/magic-link/consume

and supports routing:

- /parent/sign-in
- /parent/magic?token=...
- /parent/portal
