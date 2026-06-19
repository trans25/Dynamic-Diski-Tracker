using Diskie.API.Services;
using Diskie.DataAccess.Model.Models.Common;
using Diskie.DataAccess.Model.Models.ViewModels;
using Microsoft.AspNetCore.Mvc;

namespace Diskie.API.Controllers.SystemAdmin
{
    [Route("api/admin")]
    public class AdminSportsController : SuperAdminControllerBase
    {
        private readonly IAdminSportService _adminSportService;

        public AdminSportsController(IAdminSportService adminSportService)
        {
            _adminSportService = adminSportService;
        }

        [HttpGet("sport-templates")]
        [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<SportTemplateViewModel>>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<SportTemplateViewModel>>>> GetSportTemplates(
            CancellationToken cancellationToken)
        {
            var templates = await _adminSportService.GetTemplatesAsync(cancellationToken);
            return OkResponse(templates);
        }

        [HttpPost("sport-templates")]
        [ProducesResponseType(typeof(ApiResponse<SportTemplateViewModel>), StatusCodes.Status201Created)]
        public async Task<ActionResult<ApiResponse<SportTemplateViewModel>>> CreateSportTemplate(
            [FromBody] CreateSportTemplateViewModel model,
            CancellationToken cancellationToken)
        {
            var template = await _adminSportService.CreateTemplateAsync(model, cancellationToken);
            return CreatedResponse(nameof(GetSportTemplates), new { id = template.Id }, template);
        }

        [HttpGet("pending-requests")]
        [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<PendingSportRequestViewModel>>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<PendingSportRequestViewModel>>>> GetPendingRequests(
            CancellationToken cancellationToken)
        {
            var requests = await _adminSportService.GetPendingRequestsAsync(cancellationToken);
            return OkResponse(requests);
        }

        [HttpPost("approve-request/{requestId:guid}")]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<object>>> ApproveRequest(Guid requestId, CancellationToken cancellationToken)
        {
            var updated = await _adminSportService.ApproveRequestAsync(requestId, cancellationToken);
            return updated
                ? OkResponse<object>(new { requestId, status = "Approved" }, "Request approved")
                : NotFoundResponse("Sport request not found");
        }

        [HttpPost("reject-request/{requestId:guid}")]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<object>>> RejectRequest(Guid requestId, CancellationToken cancellationToken)
        {
            var updated = await _adminSportService.RejectRequestAsync(requestId, cancellationToken);
            return updated
                ? OkResponse<object>(new { requestId, status = "Rejected" }, "Request rejected")
                : NotFoundResponse("Sport request not found");
        }
    }
}