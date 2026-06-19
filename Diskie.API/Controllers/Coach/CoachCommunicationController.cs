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

        [HttpPut("{id:guid}")]
        [ProducesResponseType(typeof(ApiResponse<AnnouncementViewModel>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<AnnouncementViewModel>>> Update(
            Guid id, [FromBody] UpdateAnnouncementViewModel model, CancellationToken cancellationToken)
        {
            if (id != model.Id)
            {
                return BadRequest(ApiResponse<object>.Fail("Route id and body id do not match", "400"));
            }

            var announcement = await _coachService.UpdateAnnouncementAsync(model, cancellationToken);
            return announcement is null
                ? NotFoundResponse("Announcement not found or not assigned to you")
                : OkResponse(announcement, "Announcement updated");
        }

        [HttpDelete("{id:guid}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id, CancellationToken cancellationToken)
        {
            var deleted = await _coachService.DeleteAnnouncementAsync(id, cancellationToken);
            return deleted
                ? OkResponse<object>(new { id }, "Announcement deleted")
                : NotFoundResponse("Announcement not found or not assigned to you");
        }
    }
}
