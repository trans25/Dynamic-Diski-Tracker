using Diskie.API.Mapping;
using System.Text;
using System.Text.Json;
using Diskie.DataAccess.Contracts;
using Diskie.DataAccess.Model.DbModels;
using Diskie.DataAccess.Model.Models.DbModels;
using Diskie.DataAccess.Model.Models.ViewModels;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Diskie.DataAccess.Model.Models.Enums;

namespace Diskie.API.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<IdentityRole<Guid>> _roleManager;
        private readonly ITokenService _tokenService;
        private readonly IRepositoryWrapper _repository;
        private readonly DiskiDbContext _dbContext;

        public AuthService(
            UserManager<User> userManager,
            RoleManager<IdentityRole<Guid>> roleManager,
            ITokenService tokenService,
            IRepositoryWrapper repository,
            DiskiDbContext dbContext)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _tokenService = tokenService;
            _repository = repository;
            _dbContext = dbContext;
        }

        public async Task<AuthResponseViewModel?> LoginAsync(LoginRequestViewModel model, CancellationToken cancellationToken = default)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);

            if (user is null || !user.IsActive)
            {
                return null;
            }

            if (!await _userManager.CheckPasswordAsync(user, model.Password))
            {
                return null;
            }

            if (user.TenantId.HasValue)
            {
                var tenant = await _repository.Tenant
                    .FindByCondition(t => t.Id == user.TenantId.Value)
                    .Select(t => new { t.IsActive, t.IsApproved })
                    .FirstOrDefaultAsync(cancellationToken);

                if (tenant is not null && !tenant.IsActive)
                {
                    return null;
                }

                // Allow active coach and school admin accounts to sign in even if tenant approval is pending.
                var requiresApprovedTenant = user.Role != UserRole.Coach && user.Role != UserRole.SchoolAdmin;
                if (tenant is not null && !tenant.IsApproved && requiresApprovedTenant)
                {
                    return null;
                }
            }

            var (token, expiresAt) = _tokenService.GenerateToken(user);

            user.LastLoginAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            return new AuthResponseViewModel
            {
                AccessToken = token,
                ExpiresAt = expiresAt,
                User = user.ToViewModel()
            };
        }

        public async Task<(AuthResponseViewModel? Response, IReadOnlyList<string> Errors)> RegisterAsync(RegisterRequestViewModel model, CancellationToken cancellationToken = default)
        {
            var existing = await _userManager.FindByEmailAsync(model.Email);
            if (existing is not null)
            {
                return (null, new[] { "A user with this email already exists." });
            }

            var now = DateTime.UtcNow;
            Guid? tenantId = model.TenantId;

            if (!tenantId.HasValue &&
                model.Role == UserRole.SchoolAdmin &&
                !string.IsNullOrWhiteSpace(model.ClubName) &&
                model.RequestedSportTemplateId.HasValue)
            {
                var requestedTemplate = await _repository.SportTemplate
                    .FindByCondition(t => t.Id == model.RequestedSportTemplateId.Value && t.IsActive)
                    .FirstOrDefaultAsync(cancellationToken);

                if (requestedTemplate is null)
                {
                    return (null, new[] { "The selected sport template is no longer available." });
                }

                var tenant = new Tenant
                {
                    Id = Guid.NewGuid(),
                    Name = model.ClubName.Trim(),
                    Email = model.Email,
                    Phone = model.Phone,
                    IsActive = true,
                    IsApproved = false,
                    CreatedAt = now,
                    UpdatedAt = now
                };

                _repository.Tenant.Create(tenant);

                _dbContext.TenantSportRequests.Add(new TenantSportRequest
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenant.Id,
                    RequestedSportTemplateId = requestedTemplate.Id,
                    Status = SportRequestStatus.Pending,
                    RequestedDate = now,
                    CreatedAt = now,
                    UpdatedAt = now
                });

                tenantId = tenant.Id;
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                Role = model.Role,
                UserName = model.Email,
                Email = model.Email,
                Phone = model.Phone,
                FirstName = model.FirstName,
                LastName = model.LastName,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now
            };

            var createResult = await _userManager.CreateAsync(user, model.Password);
            if (!createResult.Succeeded)
            {
                return (null, createResult.Errors.Select(e => e.Description).ToList());
            }

            var roleName = model.Role.ToString();
            if (!await _roleManager.RoleExistsAsync(roleName))
            {
                await _roleManager.CreateAsync(new IdentityRole<Guid>(roleName) { Id = Guid.NewGuid() });
            }

            await _userManager.AddToRoleAsync(user, roleName);

            var (token, expiresAt) = _tokenService.GenerateToken(user);

            return (new AuthResponseViewModel
            {
                AccessToken = token,
                ExpiresAt = expiresAt,
                User = user.ToViewModel()
            }, Array.Empty<string>());
        }

        public async Task<ForgotPasswordResponseViewModel?> ForgotPasswordAsync(ForgotPasswordRequestViewModel model, CancellationToken cancellationToken = default)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user is null || !user.IsActive)
            {
                return null;
            }

            var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);

            return new ForgotPasswordResponseViewModel
            {
                Email = model.Email,
                ResetToken = resetToken
            };
        }

        public async Task<(bool Succeeded, IReadOnlyList<string> Errors)> ResetPasswordAsync(ResetPasswordRequestViewModel model, CancellationToken cancellationToken = default)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user is null)
            {
                return (false, new[] { "Invalid password reset request." });
            }

            var result = await _userManager.ResetPasswordAsync(user, model.ResetToken, model.NewPassword);
            if (!result.Succeeded)
            {
                return (false, result.Errors.Select(e => e.Description).ToList());
            }

            user.UpdatedAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            return (true, Array.Empty<string>());
        }

        public async Task<ParentMagicLinkResponseViewModel> RequestParentMagicLinkAsync(
            ParentMagicLinkRequestViewModel model,
            string baseUrl,
            CancellationToken cancellationToken = default)
        {
            var response = new ParentMagicLinkResponseViewModel
            {
                MagicLink = null,
                ExpiresAt = DateTime.UtcNow.AddMinutes(10)
            };

            if (string.IsNullOrWhiteSpace(model.ChildIdNumber) ||
                !Guid.TryParse(model.ChildIdNumber.Trim(), out var childId))
            {
                return response;
            }

            var link = await _repository.PlayerGuardian
                .FindByCondition(pg => pg.PlayerId == childId)
                .OrderByDescending(pg => pg.IsPrimary)
                .Select(pg => new { pg.PlayerId, pg.GuardianId })
                .FirstOrDefaultAsync(cancellationToken);

            if (link is null)
            {
                return response;
            }

            var guardian = await _userManager.FindByIdAsync(link.GuardianId.ToString());
            if (guardian is null || !guardian.IsActive)
            {
                return response;
            }

            var rawToken = await _userManager.GenerateUserTokenAsync(
                guardian,
                TokenOptions.DefaultProvider,
                $"parent-magic:{link.PlayerId}");

            var payloadJson = JsonSerializer.Serialize(new ParentMagicTokenPayload
            {
                GuardianId = link.GuardianId,
                ChildId = link.PlayerId,
                Token = rawToken
            });

            var encoded = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(payloadJson));
            var magicLink = $"{baseUrl.TrimEnd('/')}/parent/magic?token={Uri.EscapeDataString(encoded)}";
            Console.WriteLine($"[PARENT MAGIC LINK] ChildId={link.PlayerId} Link={magicLink}");

            response.MagicLink = magicLink;
            return response;
        }

        public async Task<ParentAuthResponseViewModel?> ConsumeParentMagicLinkAsync(
            ParentMagicTokenExchangeRequestViewModel model,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(model.Token))
            {
                return null;
            }

            ParentMagicTokenPayload payload;
            try
            {
                var decodedBytes = WebEncoders.Base64UrlDecode(model.Token);
                var decodedJson = Encoding.UTF8.GetString(decodedBytes);
                payload = JsonSerializer.Deserialize<ParentMagicTokenPayload>(decodedJson) ?? new ParentMagicTokenPayload();
            }
            catch
            {
                return null;
            }

            if (payload.GuardianId == Guid.Empty || payload.ChildId == Guid.Empty || string.IsNullOrWhiteSpace(payload.Token))
            {
                return null;
            }

            var guardian = await _userManager.FindByIdAsync(payload.GuardianId.ToString());
            if (guardian is null || !guardian.IsActive)
            {
                return null;
            }

            var hasLink = await _repository.PlayerGuardian
                .FindByCondition(pg => pg.PlayerId == payload.ChildId && pg.GuardianId == payload.GuardianId)
                .AnyAsync(cancellationToken);
            if (!hasLink)
            {
                return null;
            }

            var tokenValid = await _userManager.VerifyUserTokenAsync(
                guardian,
                TokenOptions.DefaultProvider,
                $"parent-magic:{payload.ChildId}",
                payload.Token);
            if (!tokenValid)
            {
                return null;
            }

            var child = await _repository.User
                .FindByCondition(u => u.Id == payload.ChildId)
                .Select(u => new { u.Id, u.FirstName, u.LastName })
                .FirstOrDefaultAsync(cancellationToken);

            var (jwt, expiresAt) = _tokenService.GenerateParentToken(guardian, payload.ChildId);

            return new ParentAuthResponseViewModel
            {
                AccessToken = jwt,
                ExpiresAt = expiresAt,
                ChildId = payload.ChildId.ToString(),
                ChildName = child is null ? null : $"{child.FirstName} {child.LastName}".Trim()
            };
        }

        private sealed class ParentMagicTokenPayload
        {
            public Guid GuardianId { get; set; }
            public Guid ChildId { get; set; }
            public string Token { get; set; } = string.Empty;
        }
    }
}
