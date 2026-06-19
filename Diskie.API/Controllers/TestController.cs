using Diskie.DataAccess.Model.DbModels;
using Diskie.DataAccess.Model.Models.Common;
using Diskie.DataAccess.Model.Models.DbModels;
using Diskie.DataAccess.Model.Models.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Diskie.API.Controllers
{
    [ApiController]
    [AllowAnonymous]
    [Produces("application/json")]
    [Route("api/test")]
    public class TestController : ControllerBase
    {
        private readonly DiskiDbContext _db;
        private readonly UserManager<User> _userManager;

        public TestController(DiskiDbContext db, UserManager<User> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        [HttpPost("create-coach")]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ApiResponse<object>>> CreateTestCoach(
            [FromQuery] string email = "coach.c@diskie.dev",
            [FromQuery] string password = "Coach@123",
            [FromQuery] string firstName = "Coach",
            [FromQuery] string lastName = "Caraway",
            [FromQuery] string? clubName = "Test Academy",
            CancellationToken cancellationToken = default)
        {
            var existing = await _userManager.FindByEmailAsync(email);
            if (existing is not null)
            {
                return Ok(ApiResponse<object>.Ok(new
                {
                    Email = email,
                    Message = "Coach already exists.",
                    UserId = existing.Id
                }, "Coach account already exists."));
            }

            var tenantId = Guid.NewGuid();
            var tenant = new Tenant
            {
                Id = tenantId,
                Name = clubName ?? "Test Academy",
                IsActive = true,
                IsApproved = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.Tenants.Add(tenant);
            await _db.SaveChangesAsync(cancellationToken);

            var coachUser = new User
            {
                Id = Guid.NewGuid(),
                UserName = email,
                Email = email,
                FirstName = firstName,
                LastName = lastName,
                Role = UserRole.Coach,
                TenantId = tenantId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(coachUser, password);
            if (!result.Succeeded)
            {
                return BadRequest(ApiResponse<object>.Fail(
                    string.Join(", ", result.Errors.Select(e => e.Description)),
                    "400"));
            }

            return Ok(ApiResponse<object>.Ok(new
            {
                Email = email,
                Password = password,
                FirstName = firstName,
                LastName = lastName,
                UserId = coachUser.Id,
                TenantId = tenantId
            }, "Test coach account created."));
        }

        [HttpPost("fix-coach")]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ApiResponse<object>>> FixCoachAccount(
            [FromQuery] string email = "coach.c@diskie.dev",
            [FromQuery] string? newPassword = null,
            CancellationToken cancellationToken = default)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user is null)
            {
                return BadRequest(ApiResponse<object>.Fail($"Coach account '{email}' not found in database.", "400"));
            }

            var errors = new List<string>();

            // Ensure user is active
            if (!user.IsActive)
            {
                user.IsActive = true;
                errors.Add("Set user.IsActive = true");
            }

            // Reset password if provided
            if (!string.IsNullOrWhiteSpace(newPassword))
            {
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                var resetResult = await _userManager.ResetPasswordAsync(user, token, newPassword);
                if (resetResult.Succeeded)
                {
                    errors.Add($"Password reset to: {newPassword}");
                }
                else
                {
                    errors.Add($"Password reset failed: {string.Join(", ", resetResult.Errors.Select(e => e.Description))}");
                }
            }

            // Ensure tenant exists and is active
            if (user.TenantId.HasValue)
            {
                var tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.Id == user.TenantId.Value, cancellationToken);
                if (tenant is not null)
                {
                    if (!tenant.IsActive)
                    {
                        tenant.IsActive = true;
                        errors.Add("Set tenant.IsActive = true");
                    }
                    if (!tenant.IsApproved)
                    {
                        tenant.IsApproved = true;
                        errors.Add("Set tenant.IsApproved = true");
                    }
                }
            }

            // Update user in identity
            var updateResult = await _userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
            {
                return BadRequest(ApiResponse<object>.Fail(
                    $"Failed to update user: {string.Join(", ", updateResult.Errors.Select(e => e.Description))}",
                    "400"));
            }

            // Save tenant changes
            await _db.SaveChangesAsync(cancellationToken);

            return Ok(ApiResponse<object>.Ok(new
            {
                Email = email,
                UserId = user.Id,
                TenantId = user.TenantId,
                IsActive = user.IsActive,
                Changes = errors
            }, "Coach account fixed and ready to login."));
        }
    }
}
