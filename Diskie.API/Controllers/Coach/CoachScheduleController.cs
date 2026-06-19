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

        [HttpPost("matches")]
        [ProducesResponseType(typeof(ApiResponse<FixtureViewModel>), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ApiResponse<FixtureViewModel>>> CreateMatch(
            [FromBody] CreateFixtureViewModel model, CancellationToken cancellationToken)
        {
            var fixture = await _coachService.CreateMatchAsync(model, cancellationToken);
            return fixture is null
                ? BadRequest(ApiResponse<object>.Fail("Team not found or not assigned to you", "400"))
                : CreatedResponse(nameof(GetUpcoming), new { }, fixture);
        }

        [HttpPut("matches/{id:guid}")]
        [ProducesResponseType(typeof(ApiResponse<FixtureViewModel>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<FixtureViewModel>>> UpdateMatch(
            Guid id, [FromBody] UpdateFixtureViewModel model, CancellationToken cancellationToken)
        {
            if (id != model.Id)
            {
                return BadRequest(ApiResponse<object>.Fail("Route id and body id do not match", "400"));
            }

            var fixture = await _coachService.UpdateMatchAsync(model, cancellationToken);
            return fixture is null
                ? NotFoundResponse("Fixture not found or not assigned to you")
                : OkResponse(fixture, "Fixture updated");
        }

        [HttpPatch("matches/{id:guid}/cancel")]
        [ProducesResponseType(typeof(ApiResponse<FixtureViewModel>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<FixtureViewModel>>> CancelMatch(
            Guid id, CancellationToken cancellationToken)
        {
            var fixture = await _coachService.CancelMatchAsync(id, cancellationToken);
            return fixture is null
                ? NotFoundResponse("Fixture not found or not assigned to you")
                : OkResponse(fixture, "Fixture cancelled");
        }

        [HttpDelete("matches/{id:guid}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<object>>> DeleteMatch(Guid id, CancellationToken cancellationToken)
        {
            var deleted = await _coachService.DeleteMatchAsync(id, cancellationToken);
            return deleted
                ? OkResponse<object>(new { id }, "Fixture deleted")
                : NotFoundResponse("Fixture not found or not assigned to you");
        }
    }
}
