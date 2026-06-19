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

        [HttpGet("templates")]
        [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<SportTemplateViewModel>>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<SportTemplateViewModel>>>> GetTemplates(CancellationToken cancellationToken)
        {
            var templates = await _coachService.GetSportTemplatesAsync(cancellationToken);
            return OkResponse(templates);
        }

        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<CoachTeamViewModel>), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<ApiResponse<CoachTeamViewModel>>> CreateTeam(
            [FromBody] CreateCoachTeamViewModel model, CancellationToken cancellationToken)
        {
            var result = await _coachService.CreateTeamAsync(model, cancellationToken);
            return result.Status switch
            {
                CoachTeamMutationStatus.Success =>
                    CreatedResponse(nameof(GetRoster), new { teamId = result.Team!.Id }, result.Team),
                CoachTeamMutationStatus.DuplicateName => Conflict(ApiResponse<object>.Fail(
                    "A team with this name already exists in this season. Choose a different name.", "409")),
                _ => BadRequest(ApiResponse<object>.Fail("Selected sport template or season was not found.", "400"))
            };
        }

        [HttpPut("{teamId:guid}")]
        [ProducesResponseType(typeof(ApiResponse<CoachTeamViewModel>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<ApiResponse<CoachTeamViewModel>>> UpdateTeam(
            Guid teamId, [FromBody] UpdateCoachTeamViewModel model, CancellationToken cancellationToken)
        {
            if (teamId != model.Id)
            {
                return BadRequest(ApiResponse<object>.Fail("Route id and body id do not match", "400"));
            }

            var result = await _coachService.UpdateTeamAsync(model, cancellationToken);
            return result.Status switch
            {
                CoachTeamMutationStatus.Success => OkResponse(result.Team!, "Team updated"),
                CoachTeamMutationStatus.DuplicateName => Conflict(ApiResponse<object>.Fail(
                    "A team with this name already exists in this season. Choose a different name.", "409")),
                _ => NotFoundResponse("Team not found or not assigned to you")
            };
        }

        [HttpDelete("{teamId:guid}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<ApiResponse<object>>> DeleteTeam(Guid teamId, CancellationToken cancellationToken)
        {
            var result = await _coachService.DeleteTeamAsync(teamId, cancellationToken);
            return result switch
            {
                CoachTeamDeleteResult.Deleted => OkResponse<object>(new { teamId }, "Team deleted"),
                CoachTeamDeleteResult.HasDependents => Conflict(ApiResponse<object>.Fail(
                    "This team still has players or fixtures. Remove them before deleting the team.")),
                _ => NotFoundResponse("Team not found or not assigned to you")
            };
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

        [HttpPost("{teamId:guid}/roster")]
        [ProducesResponseType(typeof(ApiResponse<RosterPlayerViewModel>), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<RosterPlayerViewModel>>> AddPlayer(
            Guid teamId, [FromBody] CreateRosterPlayerViewModel model, CancellationToken cancellationToken)
        {
            var player = await _coachService.AddPlayerAsync(teamId, model, cancellationToken);
            return player is null
                ? NotFoundResponse("Team not found or not assigned to you")
                : CreatedResponse(nameof(GetRoster), new { teamId }, player);
        }

        [HttpPut("{teamId:guid}/roster/{playerId:guid}")]
        [ProducesResponseType(typeof(ApiResponse<RosterPlayerViewModel>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<RosterPlayerViewModel>>> UpdatePlayer(
            Guid teamId, Guid playerId, [FromBody] UpdateRosterPlayerViewModel model, CancellationToken cancellationToken)
        {
            var player = await _coachService.UpdatePlayerAsync(teamId, playerId, model, cancellationToken);
            return player is null
                ? NotFoundResponse("Player not found or not on your team")
                : OkResponse(player, "Player updated");
        }

        [HttpDelete("{teamId:guid}/roster/{playerId:guid}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<object>>> RemovePlayer(
            Guid teamId, Guid playerId, CancellationToken cancellationToken)
        {
            var removed = await _coachService.RemovePlayerAsync(teamId, playerId, cancellationToken);
            return removed
                ? OkResponse<object>(new { teamId, playerId }, "Player removed from team")
                : NotFoundResponse("Player not found or not on your team");
        }

        [HttpPost("{teamId:guid}/roster/import")]
        [ProducesResponseType(typeof(ApiResponse<ImportPlayersResultViewModel>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<ImportPlayersResultViewModel>>> ImportPlayers(
            Guid teamId, [FromBody] ImportPlayersViewModel model, CancellationToken cancellationToken)
        {
            var result = await _coachService.ImportPlayersAsync(teamId, model, cancellationToken);
            return result is null
                ? NotFoundResponse("Team not found or not assigned to you")
                : OkResponse(result, "Import complete");
        }

        [HttpGet("players/{playerId:guid}/performance")]
        [ProducesResponseType(typeof(ApiResponse<PlayerPerformanceViewModel>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<PlayerPerformanceViewModel>>> GetPlayerPerformance(
            Guid playerId, CancellationToken cancellationToken)
        {
            var performance = await _coachService.GetPlayerPerformanceAsync(playerId, cancellationToken);
            return performance is null
                ? NotFoundResponse("Player not found or not on your teams")
                : OkResponse(performance);
        }

        [HttpPost("guardians/invite")]
        [ProducesResponseType(typeof(ApiResponse<GuardianInviteResultViewModel>), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<GuardianInviteResultViewModel>>> InviteGuardian(
            [FromBody] InviteGuardianViewModel model, CancellationToken cancellationToken)
        {
            var result = await _coachService.InviteGuardianAsync(model, cancellationToken);
            return result is null
                ? NotFoundResponse("Player not found or not on your teams")
                : CreatedResponse(nameof(GetPlayerPerformance), new { playerId = model.PlayerId }, result);
        }
    }
}
