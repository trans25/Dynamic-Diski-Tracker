using Diskie.API.Mapping;
using Diskie.DataAccess.Model.DbModels;
using Diskie.DataAccess.Model.Models.ViewModels;
using Microsoft.AspNetCore.Identity;

namespace Diskie.API.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<IdentityRole<Guid>> _roleManager;
        private readonly ITokenService _tokenService;

        public AuthService(
            UserManager<User> userManager,
            RoleManager<IdentityRole<Guid>> roleManager,
            ITokenService tokenService)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _tokenService = tokenService;
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
            var user = new User
            {
                Id = Guid.NewGuid(),
                TenantId = model.TenantId,
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
    }
}
