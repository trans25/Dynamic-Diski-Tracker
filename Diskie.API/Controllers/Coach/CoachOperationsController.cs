using Diskie.API.Security;
using Diskie.API.Services.Coach;
using Diskie.DataAccess.Model.Models.Common;
using Diskie.DataAccess.Model.Models.ViewModels;
using Microsoft.AspNetCore.Mvc;

namespace Diskie.API.Controllers.Coach
{
    [Route("api")]
    public class CoachOperationsController : CoachControllerBase
    {
        private readonly ICoachOperationsService _operations;

        public CoachOperationsController(ICoachOperationsService operations, ICurrentUserContext currentUser)
            : base(currentUser)
        {
            _operations = operations;
        }

        [HttpGet("matches/{id:guid}/availability")]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<MatchAvailabilityItemViewModel>>>> GetAvailability(Guid id, CancellationToken cancellationToken)
        {
            var result = await _operations.GetMatchAvailabilityAsync(id, cancellationToken);
            return OkResponse(result);
        }

        [HttpPost("matches/{id:guid}/availability/request")]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<MatchAvailabilityItemViewModel>>>> RequestAvailability(Guid id, [FromBody] RequestAvailabilityViewModel model, CancellationToken cancellationToken)
        {
            var result = await _operations.RequestAvailabilityAsync(id, model.PlayerIds, cancellationToken);
            return OkResponse(result, "Availability request sent");
        }

        [HttpPost("matches/{id:guid}/availability")]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<MatchAvailabilityItemViewModel>>>> UpdateAvailability(Guid id, [FromBody] UpdateMatchAvailabilityViewModel model, CancellationToken cancellationToken)
        {
            var result = await _operations.UpdateAvailabilityAsync(id, model.Players, cancellationToken);
            return OkResponse(result, "Availability updated");
        }

        [HttpGet("player/{playerId:guid}/injuries")]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<InjuryViewModel>>>> GetPlayerInjuries(Guid playerId, CancellationToken cancellationToken)
        {
            var result = await _operations.GetPlayerInjuriesAsync(playerId, cancellationToken);
            return OkResponse(result);
        }

        [HttpPost("player/injury")]
        public async Task<ActionResult<ApiResponse<InjuryViewModel>>> CreatePlayerInjury([FromBody] CreateInjuryViewModel model, CancellationToken cancellationToken)
        {
            var result = await _operations.CreatePlayerInjuryAsync(model, cancellationToken);
            return result is null ? NotFoundResponse("Player not found or not on your teams") : OkResponse(result, "Injury logged");
        }

        [HttpGet("tactics/{matchId:guid}")]
        public async Task<ActionResult<ApiResponse<TacticalLayoutViewModel>>> GetTactics(Guid matchId, CancellationToken cancellationToken)
        {
            var result = await _operations.GetTacticalLayoutAsync(matchId, cancellationToken);
            return result is null ? NotFoundResponse("Match not found or not assigned to you") : OkResponse(result);
        }

        [HttpPost("tactics/save")]
        public async Task<ActionResult<ApiResponse<TacticalLayoutViewModel>>> SaveTactics([FromBody] SaveTacticalLayoutViewModel model, CancellationToken cancellationToken)
        {
            var result = await _operations.SaveTacticalLayoutAsync(model, cancellationToken);
            return result is null ? NotFoundResponse("Match not found or not assigned to you") : OkResponse(result, "Tactics saved");
        }

        [HttpPost("players/import")]
        [RequestSizeLimit(10_000_000)]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<ApiResponse<ImportPlayersCsvResultViewModel>>> ImportPlayers([FromQuery] Guid teamId, IFormFile file, CancellationToken cancellationToken)
        {
            var result = await _operations.ImportPlayersCsvAsync(teamId, file, cancellationToken);
            return result is null ? NotFoundResponse("Team not found or not assigned to you") : OkResponse(result, "Import complete");
        }

        [HttpGet("alerts")]
        public async Task<ActionResult<ApiResponse<AlertsResponseViewModel>>> GetAlerts(CancellationToken cancellationToken)
        {
            var result = await _operations.GetAlertsAsync(cancellationToken);
            return OkResponse(result);
        }

        [HttpPost("alerts/{id:guid}/read")]
        public async Task<ActionResult<ApiResponse<object>>> MarkAlertRead(Guid id, CancellationToken cancellationToken)
        {
            var marked = await _operations.MarkAlertReadAsync(id, cancellationToken);
            return marked ? OkResponse<object>(new { id }, "Alert marked as read") : NotFoundResponse("Alert not found");
        }
    }
}
