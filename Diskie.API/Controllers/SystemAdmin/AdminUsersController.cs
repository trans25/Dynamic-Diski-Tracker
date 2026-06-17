using Diskie.API.Services;
using Diskie.DataAccess.Model.Models.Common;
using Diskie.DataAccess.Model.Models.ViewModels;
using Microsoft.AspNetCore.Mvc;

namespace Diskie.API.Controllers.SystemAdmin
{
    [Route("api/admin/users")]
    public class AdminUsersController : SuperAdminControllerBase
    {
        private readonly IAdminUserService _adminUserService;

        public AdminUsersController(IAdminUserService adminUserService)
        {
            _adminUserService = adminUserService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<UserViewModel>>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<UserViewModel>>>> GetAll(
            [FromQuery] Guid? tenantId, CancellationToken cancellationToken)
        {
            var users = await _adminUserService.GetAllAsync(tenantId, cancellationToken);
            return OkResponse(users);
        }

        [HttpGet("{id:guid}")]
        [ProducesResponseType(typeof(ApiResponse<UserViewModel>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<UserViewModel>>> GetById(Guid id, CancellationToken cancellationToken)
        {
            var user = await _adminUserService.GetByIdAsync(id, cancellationToken);
            return user is null ? NotFoundResponse("User not found") : OkResponse(user);
        }

        [HttpPut("role")]
        [ProducesResponseType(typeof(ApiResponse<UserViewModel>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<UserViewModel>>> AssignRole(
            [FromBody] AssignRoleViewModel model, CancellationToken cancellationToken)
        {
            var user = await _adminUserService.AssignRoleAsync(model, cancellationToken);
            return user is null ? NotFoundResponse("User not found") : OkResponse(user, "Role assigned");
        }

        [HttpPatch("{id:guid}/disable")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<object>>> Disable(Guid id, CancellationToken cancellationToken)
        {
            var updated = await _adminUserService.SetActiveStateAsync(id, isActive: false, cancellationToken);
            return updated
                ? OkResponse<object>(new { id, isActive = false }, "User disabled")
                : NotFoundResponse("User not found");
        }

        [HttpPatch("{id:guid}/enable")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<object>>> Enable(Guid id, CancellationToken cancellationToken)
        {
            var updated = await _adminUserService.SetActiveStateAsync(id, isActive: true, cancellationToken);
            return updated
                ? OkResponse<object>(new { id, isActive = true }, "User enabled")
                : NotFoundResponse("User not found");
        }
    }
}
