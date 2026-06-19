using Diskie.API.Security;
using Diskie.API.Services.Coach;
using Diskie.DataAccess.Model.Models.Common;
using Diskie.DataAccess.Model.Models.ViewModels;
using Microsoft.AspNetCore.Mvc;

namespace Diskie.API.Controllers.Coach
{
    [Route("api/matches")]
    public class MatchesController : CoachControllerBase
    {
        private readonly ICoachService _coachService;

        public MatchesController(ICoachService coachService, ICurrentUserContext currentUser)
            : base(currentUser)
        {
            _coachService = coachService;
        }

        [HttpGet("{matchId:guid}")]
        [ProducesResponseType(typeof(ApiResponse<LiveMatchViewModel>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<LiveMatchViewModel>>> GetLiveMatch(
            Guid matchId,
            CancellationToken cancellationToken)
        {
            var liveMatch = await _coachService.GetLiveMatchAsync(matchId, cancellationToken);
            return liveMatch is null
                ? NotFoundResponse("Match not found or not assigned to you")
                : OkResponse(liveMatch);
        }

        [HttpPost("{matchId:guid}/events")]
        [ProducesResponseType(typeof(ApiResponse<MatchEventViewModel>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ApiResponse<MatchEventViewModel>>> PostMatchEvent(
            Guid matchId,
            [FromBody] CreateMatchEventViewModel model,
            CancellationToken cancellationToken)
        {
            var evt = await _coachService.PostLiveMatchEventAsync(matchId, model, cancellationToken);
            return evt is null
                ? NotFoundResponse("Match/player not found or not assigned to you")
                : OkResponse(evt, "Event recorded");
        }
    }
}
