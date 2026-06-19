using Diskie.API.Services;
using Diskie.DataAccess.Model.Models.Common;
using Diskie.DataAccess.Model.Models.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Diskie.API.Controllers.SystemAdmin
{
    [Route("api/auth")]
    [ApiController]
    [Produces("application/json")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IAdminSportService _adminSportService;

        public AuthController(IAuthService authService, IAdminSportService adminSportService)
        {
            _authService = authService;
            _adminSportService = adminSportService;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<AuthResponseViewModel>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<ApiResponse<AuthResponseViewModel>>> Login(
            [FromBody] LoginRequestViewModel model, CancellationToken cancellationToken)
        {
            var result = await _authService.LoginAsync(model, cancellationToken);
            if (result is null)
            {
                return Unauthorized(ApiResponse<object>.Fail("Invalid credentials", "401"));
            }

            return Ok(ApiResponse<AuthResponseViewModel>.Ok(result, "Login successful"));
        }

        [HttpPost("register")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<AuthResponseViewModel>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ApiResponse<AuthResponseViewModel>>> Register(
            [FromBody] RegisterRequestViewModel model, CancellationToken cancellationToken)
        {
            var (response, errors) = await _authService.RegisterAsync(model, cancellationToken);
            if (response is null)
            {
                return BadRequest(ApiResponse<object>.Fail(string.Join(" ", errors), "400"));
            }

            var submittedForApproval = !model.TenantId.HasValue
                && !string.IsNullOrWhiteSpace(model.ClubName)
                && model.RequestedSportTemplateId.HasValue;

            return Ok(ApiResponse<AuthResponseViewModel>.Ok(
                response,
                submittedForApproval ? "Registration submitted for approval" : "Registration successful"));
        }

        [HttpGet("sport-templates")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<SportTemplateViewModel>>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<SportTemplateViewModel>>>> GetSignupSportTemplates(
            CancellationToken cancellationToken)
        {
            var templates = await _adminSportService.GetActiveTemplatesAsync(cancellationToken);
            return Ok(ApiResponse<IReadOnlyList<SportTemplateViewModel>>.Ok(templates, "Templates loaded"));
        }

        [HttpPost("forgot-password")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<ForgotPasswordResponseViewModel>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<ForgotPasswordResponseViewModel>>> ForgotPassword(
            [FromBody] ForgotPasswordRequestViewModel model, CancellationToken cancellationToken)
        {
            var result = await _authService.ForgotPasswordAsync(model, cancellationToken);

            // Always return a generic success to avoid leaking which emails exist.
            if (result is null)
            {
                return Ok(ApiResponse<object>.Ok(
                    new object(),
                    "If an account with that email exists, a password reset token has been generated."));
            }

            return Ok(ApiResponse<ForgotPasswordResponseViewModel>.Ok(
                result,
                "Password reset token generated."));
        }

        [HttpPost("reset-password")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ApiResponse<object>>> ResetPassword(
            [FromBody] ResetPasswordRequestViewModel model, CancellationToken cancellationToken)
        {
            var (succeeded, errors) = await _authService.ResetPasswordAsync(model, cancellationToken);
            if (!succeeded)
            {
                return BadRequest(ApiResponse<object>.Fail(string.Join(" ", errors), "400"));
            }

            return Ok(ApiResponse<object>.Ok(new object(), "Password has been reset successfully."));
        }

        [HttpPost("parent/magic-link/request")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<ParentMagicLinkResponseViewModel>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<ParentMagicLinkResponseViewModel>>> RequestParentMagicLink(
            [FromBody] ParentMagicLinkRequestViewModel model,
            CancellationToken cancellationToken)
        {
            var baseUrl = $"{Request.Scheme}://{Request.Host}";
            var result = await _authService.RequestParentMagicLinkAsync(model, baseUrl, cancellationToken);
            return Ok(ApiResponse<ParentMagicLinkResponseViewModel>.Ok(result, "Magic link generated."));
        }

        [HttpPost("parent/magic-link/consume")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<ParentAuthResponseViewModel>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<ApiResponse<ParentAuthResponseViewModel>>> ConsumeParentMagicLink(
            [FromBody] ParentMagicTokenExchangeRequestViewModel model,
            CancellationToken cancellationToken)
        {
            var result = await _authService.ConsumeParentMagicLinkAsync(model, cancellationToken);
            if (result is null)
            {
                return Unauthorized(ApiResponse<object>.Fail("Magic link is invalid or expired", "401"));
            }

            return Ok(ApiResponse<ParentAuthResponseViewModel>.Ok(result, "Parent login successful"));
        }
    }
}
