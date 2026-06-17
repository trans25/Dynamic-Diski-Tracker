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
    }
}
