using Diskie.API.Authorization;
using Diskie.API.Services.Coach;
using Diskie.DataAccess.Model.Models.Common;
using Diskie.DataAccess.Model.Models.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Diskie.API.Controllers.Coach
{
    [ApiController]
    [Produces("application/json")]
    [Authorize(Policy = AuthorizationPolicies.CoachOnly)]
    [Route("api")]
    public class CoachInsightsController : ControllerBase
    {
        private readonly ICoachInsightsService _insights;

        public CoachInsightsController(ICoachInsightsService insights)
        {
            _insights = insights;
        }

        [HttpGet("player/{playerId:guid}/growth")]
        [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<PlayerGrowthPointViewModel>>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<PlayerGrowthPointViewModel>>>> GetPlayerGrowth(
            Guid playerId,
            [FromQuery] string? season,
            CancellationToken cancellationToken)
        {
            var result = await _insights.GetPlayerGrowthAsync(playerId, season, cancellationToken);
            return Ok(ApiResponse<IReadOnlyList<PlayerGrowthPointViewModel>>.Ok(result));
        }

        [HttpGet("player/{playerId:guid}/skills")]
        [ProducesResponseType(typeof(ApiResponse<PlayerSkillsViewModel>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<PlayerSkillsViewModel>>> GetPlayerSkills(
            Guid playerId,
            CancellationToken cancellationToken)
        {
            var result = await _insights.GetPlayerSkillsAsync(playerId, cancellationToken);
            return result is null
                ? NotFound(ApiResponse<object>.Fail("Player skills not found.", "404"))
                : Ok(ApiResponse<PlayerSkillsViewModel>.Ok(result));
        }

        [HttpGet("player/{playerId:guid}/achievements")]
        [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<PlayerAchievementViewModel>>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<PlayerAchievementViewModel>>>> GetPlayerAchievements(
            Guid playerId,
            CancellationToken cancellationToken)
        {
            var result = await _insights.GetPlayerAchievementsAsync(playerId, cancellationToken);
            return Ok(ApiResponse<IReadOnlyList<PlayerAchievementViewModel>>.Ok(result));
        }

        [HttpGet("squad/fatigue")]
        [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<SquadFatigueItemViewModel>>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<SquadFatigueItemViewModel>>>> GetSquadFatigue(CancellationToken cancellationToken)
        {
            var result = await _insights.GetSquadFatigueAsync(cancellationToken);
            return Ok(ApiResponse<IReadOnlyList<SquadFatigueItemViewModel>>.Ok(result));
        }

        [HttpGet("squad/positional-depth")]
        [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<PositionalDepthItemViewModel>>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<PositionalDepthItemViewModel>>>> GetPositionalDepth(CancellationToken cancellationToken)
        {
            var result = await _insights.GetPositionalDepthAsync(cancellationToken);
            return Ok(ApiResponse<IReadOnlyList<PositionalDepthItemViewModel>>.Ok(result));
        }

        [HttpGet("analytics/training-correlation")]
        [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<TrainingMatchCorrelationPointViewModel>>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<TrainingMatchCorrelationPointViewModel>>>> GetTrainingCorrelation(CancellationToken cancellationToken)
        {
            var result = await _insights.GetTrainingCorrelationAsync(cancellationToken);
            return Ok(ApiResponse<IReadOnlyList<TrainingMatchCorrelationPointViewModel>>.Ok(result));
        }

        [HttpGet("analytics/chemistry-pairs")]
        [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ChemistryPairViewModel>>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<ChemistryPairViewModel>>>> GetChemistryPairs(
            [FromQuery] int top = 5,
            CancellationToken cancellationToken = default)
        {
            var safeTop = Math.Clamp(top, 1, 20);
            var result = await _insights.GetTopChemistryPairsAsync(safeTop, cancellationToken);
            return Ok(ApiResponse<IReadOnlyList<ChemistryPairViewModel>>.Ok(result));
        }
    }
}
