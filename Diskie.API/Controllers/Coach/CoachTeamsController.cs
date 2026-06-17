using Diskie.API.Security;
using Diskie.API.Services.Coach;
using Diskie.DataAccess.Model.Models.Common;
using Diskie.DataAccess.Model.Models.ViewModels;
using Microsoft.AspNetCore.Mvc;

namespace Diskie.API.Controllers.Coach
{
    [Route("api/coach/teams")]
    public class CoachTeamsController : CoachControllerBase
    {
        private readonly ICoachService _coachService;

        public CoachTeamsController(ICoachService coachService, ICurrentUserContext currentUser)
            : base(currentUser)
        {
            _coachService = coachService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<CoachTeamViewModel>>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<CoachTeamViewModel>>>> GetMyTeams(CancellationToken cancellationToken)
        {
            var teams = await _coachService.GetMyTeamsAsync(cancellationToken);
            return OkResponse(teams);
        }

        [HttpGet("{teamId:guid}/roster")]
        [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<RosterPlayerViewModel>>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<RosterPlayerViewModel>>>> GetRoster(
            Guid teamId, CancellationToken cancellationToken)
        {
            var roster = await _coachService.GetRosterAsync(teamId, cancellationToken);
            return roster is null
                ? NotFoundResponse("Team not found or not assigned to you")
                : OkResponse(roster);
        }
    }
}
