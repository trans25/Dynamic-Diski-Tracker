using Diskie.API.Authorization;
using Diskie.API.Services.Coach;
using Diskie.DataAccess.Model.Models.Common;
using Diskie.DataAccess.Model.Models.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Diskie.API.Controllers
{
    [ApiController]
    [Produces("application/json")]
    [Authorize(Policy = AuthorizationPolicies.CoachOnly)]
    [Route("api")]
    public class TrainingController : ControllerBase
    {
        private readonly ICoachInsightsService _insights;

        public TrainingController(ICoachInsightsService insights)
        {
            _insights = insights;
        }

        [HttpPost("training/attendance")]
        [ProducesResponseType(typeof(ApiResponse<SquadAttendanceSummaryViewModel>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<SquadAttendanceSummaryViewModel>>> MarkAttendance(
            [FromBody] MarkTrainingAttendanceViewModel model,
            CancellationToken cancellationToken)
        {
            var result = await _insights.MarkTrainingAttendanceAsync(model, cancellationToken);
            return result is null
                ? NotFound(ApiResponse<object>.Fail("Player not found or not on your teams", "404"))
                : Ok(ApiResponse<SquadAttendanceSummaryViewModel>.Ok(result, "Attendance updated"));
        }

        [HttpGet("squad/attendance")]
        [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<SquadAttendanceSummaryViewModel>>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<SquadAttendanceSummaryViewModel>>>> GetAttendance(
            [FromQuery] Guid? teamId,
            [FromQuery] DateOnly? sessionDate,
            CancellationToken cancellationToken)
        {
            var result = await _insights.GetSquadAttendanceAsync(teamId, sessionDate, cancellationToken);
            return Ok(ApiResponse<IReadOnlyList<SquadAttendanceSummaryViewModel>>.Ok(result));
        }
    }
}
