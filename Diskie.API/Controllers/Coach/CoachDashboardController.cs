using Diskie.API.Security;
using Diskie.API.Services.Coach;
using Diskie.DataAccess.Model.Models.Common;
using Diskie.DataAccess.Model.Models.ViewModels;
using Microsoft.AspNetCore.Mvc;

namespace Diskie.API.Controllers.Coach
{
    [Route("api/coach/dashboard")]
    public class CoachDashboardController : CoachControllerBase
    {
        private readonly ICoachService _coachService;

        public CoachDashboardController(ICoachService coachService, ICurrentUserContext currentUser)
            : base(currentUser)
        {
            _coachService = coachService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<CoachDashboardViewModel>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<CoachDashboardViewModel>>> Get(CancellationToken cancellationToken)
        {
            var dashboard = await _coachService.GetDashboardAsync(cancellationToken);
            return OkResponse(dashboard);
        }
    }
}
