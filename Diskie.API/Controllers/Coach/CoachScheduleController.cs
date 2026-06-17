using Diskie.API.Security;
using Diskie.API.Services.Coach;
using Diskie.DataAccess.Model.Models.Common;
using Diskie.DataAccess.Model.Models.ViewModels;
using Microsoft.AspNetCore.Mvc;

namespace Diskie.API.Controllers.Coach
{
    [Route("api/coach/schedule")]
    public class CoachScheduleController : CoachControllerBase
    {
        private readonly ICoachService _coachService;

        public CoachScheduleController(ICoachService coachService, ICurrentUserContext currentUser)
            : base(currentUser)
        {
            _coachService = coachService;
        }

        [HttpGet("upcoming")]
        [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<FixtureViewModel>>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<FixtureViewModel>>>> GetUpcoming(CancellationToken cancellationToken)
        {
            var fixtures = await _coachService.GetUpcomingFixturesAsync(cancellationToken);
            return OkResponse(fixtures);
        }

        [HttpGet("history")]
        [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<FixtureViewModel>>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<FixtureViewModel>>>> GetHistory(
            [FromQuery] Guid? teamId, CancellationToken cancellationToken)
        {
            var fixtures = await _coachService.GetMatchHistoryAsync(teamId, cancellationToken);
            return OkResponse(fixtures);
        }
    }
}
