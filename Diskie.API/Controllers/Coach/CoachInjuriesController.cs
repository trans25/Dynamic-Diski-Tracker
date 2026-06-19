using Diskie.API.Security;
using Diskie.API.Services.Coach;
using Diskie.DataAccess.Model.Models.Common;
using Diskie.DataAccess.Model.Models.ViewModels;
using Microsoft.AspNetCore.Mvc;

namespace Diskie.API.Controllers.Coach
{
    [Route("api/coach/injuries")]
    public class CoachInjuriesController : CoachControllerBase
    {
        private readonly ICoachService _coachService;

        public CoachInjuriesController(ICoachService coachService, ICurrentUserContext currentUser)
            : base(currentUser)
        {
            _coachService = coachService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<InjuryViewModel>>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<InjuryViewModel>>>> Get(
            [FromQuery] Guid? teamId, CancellationToken cancellationToken)
        {
            var injuries = await _coachService.GetTeamInjuriesAsync(teamId, cancellationToken);
            return OkResponse(injuries);
        }

        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<InjuryViewModel>), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ApiResponse<InjuryViewModel>>> Create(
            [FromBody] CreateInjuryViewModel model, CancellationToken cancellationToken)
        {
            var injury = await _coachService.CreateInjuryAsync(model, cancellationToken);
            return injury is null
                ? BadRequest(ApiResponse<object>.Fail("Player not found or not on your teams", "400"))
                : CreatedResponse(nameof(Get), new { }, injury);
        }

        [HttpPut("{id:guid}")]
        [ProducesResponseType(typeof(ApiResponse<InjuryViewModel>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<InjuryViewModel>>> Update(
            Guid id, [FromBody] UpdateInjuryViewModel model, CancellationToken cancellationToken)
        {
            if (id != model.Id)
            {
                return BadRequest(ApiResponse<object>.Fail("Route id and body id do not match", "400"));
            }

            var injury = await _coachService.UpdateInjuryAsync(model, cancellationToken);
            return injury is null
                ? NotFoundResponse("Injury not found or not on your teams")
                : OkResponse(injury, "Injury updated");
        }

        [HttpDelete("{id:guid}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id, CancellationToken cancellationToken)
        {
            var deleted = await _coachService.DeleteInjuryAsync(id, cancellationToken);
            return deleted
                ? OkResponse<object>(new { id }, "Injury deleted")
                : NotFoundResponse("Injury not found or not on your teams");
        }
    }
}
