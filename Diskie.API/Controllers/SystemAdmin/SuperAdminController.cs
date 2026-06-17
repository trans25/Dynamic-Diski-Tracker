using Diskie.API.Services;
using Diskie.DataAccess.Model.Models.Common;
using Diskie.DataAccess.Model.Models.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Diskie.API.Controllers.SystemAdmin
{
    [Route("api/admin/super-admin")]
    [Authorize(Roles = "SuperAdmin")]
    public class SuperAdminController : SuperAdminControllerBase
    {
        private readonly ISuperAdminService _superAdminService;

        public SuperAdminController(ISuperAdminService superAdminService)
        {
            _superAdminService = superAdminService;
        }

        [HttpGet("profile")]

        public async Task<ActionResult<ApiResponse<UserViewModel>>> GetProfile(CancellationToken cancellationToken)
        {
            if (CurrentUserId is null)
            {
                return NotFoundResponse("Authenticated user not found");
            }

            var profile = await _superAdminService.GetProfileAsync(CurrentUserId.Value, cancellationToken);
            return profile is null
                ? NotFoundResponse("Profile not found")
                : OkResponse(profile);
        }

        [HttpGet("dashboard")]
        
        public async Task<ActionResult<ApiResponse<SuperAdminDashboardViewModel>>> GetDashboard(CancellationToken cancellationToken)
        {
            var dashboard = await _superAdminService.GetDashboardAsync(cancellationToken);
            return OkResponse(dashboard);
        }
    }
}
