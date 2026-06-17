using Diskie.API.Services;
using Diskie.DataAccess.Model.Models.Common;
using Diskie.DataAccess.Model.Models.ViewModels;
using Microsoft.AspNetCore.Mvc;

namespace Diskie.API.Controllers.SystemAdmin
{
    [Route("api/admin/templates")]
    public class TemplatesController : SuperAdminControllerBase
    {
        private readonly ITemplateService _templateService;

        public TemplatesController(ITemplateService templateService)
        {
            _templateService = templateService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<SportTemplateViewModel>>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<SportTemplateViewModel>>>> GetAll(CancellationToken cancellationToken)
        {
            var templates = await _templateService.GetAllAsync(cancellationToken);
            return OkResponse(templates);
        }

        [HttpGet("{id:guid}")]
        [ProducesResponseType(typeof(ApiResponse<SportTemplateViewModel>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<SportTemplateViewModel>>> GetById(Guid id, CancellationToken cancellationToken)
        {
            var template = await _templateService.GetByIdAsync(id, cancellationToken);
            return template is null ? NotFoundResponse("Template not found") : OkResponse(template);
        }

        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<SportTemplateViewModel>), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ApiResponse<SportTemplateViewModel>>> Create(
            [FromBody] CreateSportTemplateViewModel model, CancellationToken cancellationToken)
        {
            var template = await _templateService.CreateAsync(model, cancellationToken);
            return CreatedResponse(nameof(GetById), new { id = template.Id }, template);
        }

        [HttpPut("{id:guid}")]
        [ProducesResponseType(typeof(ApiResponse<SportTemplateViewModel>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<SportTemplateViewModel>>> Update(
            Guid id, [FromBody] UpdateSportTemplateViewModel model, CancellationToken cancellationToken)
        {
            if (id != model.Id)
            {
                return BadRequest(ApiResponse<object>.Fail("Route id and body id do not match", "400"));
            }

            var template = await _templateService.UpdateAsync(model, cancellationToken);
            return template is null ? NotFoundResponse("Template not found") : OkResponse(template, "Template updated");
        }

        [HttpDelete("{id:guid}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id, CancellationToken cancellationToken)
        {
            var deleted = await _templateService.DeleteAsync(id, cancellationToken);
            return deleted
                ? OkResponse<object>(new { id }, "Template deleted")
                : NotFoundResponse("Template not found");
        }
    }
}
