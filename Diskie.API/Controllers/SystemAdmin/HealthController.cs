using Diskie.API.Services;
using Diskie.DataAccess.Model.Models.Common;
using Diskie.DataAccess.Model.Models.ViewModels;
using Microsoft.AspNetCore.Mvc;

namespace Diskie.API.Controllers.SystemAdmin
{
    [Route("api/admin/health")]
    public class HealthController : SuperAdminControllerBase
    {
        private readonly IHealthService _healthService;

        public HealthController(IHealthService healthService)
        {
            _healthService = healthService;
        }

        [HttpGet("summary")]
        [ProducesResponseType(typeof(ApiResponse<SystemHealthViewModel>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<SystemHealthViewModel>>> GetSummary(CancellationToken cancellationToken)
        {
            var health = await _healthService.GetSummaryAsync(cancellationToken);
            return OkResponse(health);
        }
    }
}
