using Diskie.API.Security;
using Diskie.API.Services.Coach;
using Diskie.DataAccess.Model.Models.Common;
using Diskie.DataAccess.Model.Models.ViewModels;
using Microsoft.AspNetCore.Mvc;

namespace Diskie.API.Controllers.Coach
{
    [Route("api/coach/announcements")]
    public class CoachCommunicationController : CoachControllerBase
    {
        private readonly ICoachService _coachService;

        public CoachCommunicationController(ICoachService coachService, ICurrentUserContext currentUser)
            : base(currentUser)
        {
            _coachService = coachService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<AnnouncementViewModel>>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<AnnouncementViewModel>>>> Get(CancellationToken cancellationToken)
        {
            var announcements = await _coachService.GetAnnouncementsAsync(cancellationToken);
            return OkResponse(announcements);
        }

        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<AnnouncementViewModel>), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ApiResponse<AnnouncementViewModel>>> Create(
            [FromBody] CreateAnnouncementViewModel model, CancellationToken cancellationToken)
        {
            var announcement = await _coachService.CreateAnnouncementAsync(model, cancellationToken);
            return announcement is null
                ? BadRequest(ApiResponse<object>.Fail("Team not found or not assigned to you", "400"))
                : CreatedResponse(nameof(Get), new { }, announcement);
        }
    }
}
