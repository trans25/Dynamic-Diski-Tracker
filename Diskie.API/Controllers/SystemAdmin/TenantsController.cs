using Diskie.API.Services;
using Diskie.DataAccess.Model.Models.Common;
using Diskie.DataAccess.Model.Models.ViewModels;
using Microsoft.AspNetCore.Mvc;

namespace Diskie.API.Controllers.SystemAdmin
{
    [Route("api/admin/tenants")]
    public class TenantsController : SuperAdminControllerBase
    {
        private readonly ITenantService _tenantService;

        public TenantsController(ITenantService tenantService)
        {
            _tenantService = tenantService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<TenantViewModel>>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<TenantViewModel>>>> GetAll(CancellationToken cancellationToken)
        {
            var tenants = await _tenantService.GetAllAsync(cancellationToken);
            return OkResponse(tenants);
        }

        [HttpGet("{id:guid}")]
        [ProducesResponseType(typeof(ApiResponse<TenantViewModel>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<TenantViewModel>>> GetById(Guid id, CancellationToken cancellationToken)
        {
            var tenant = await _tenantService.GetByIdAsync(id, cancellationToken);
            return tenant is null ? NotFoundResponse("Tenant not found") : OkResponse(tenant);
        }

        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<TenantViewModel>), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ApiResponse<TenantViewModel>>> Create(
            [FromBody] CreateTenantViewModel model, CancellationToken cancellationToken)
        {
            var tenant = await _tenantService.CreateAsync(model, cancellationToken);
            return CreatedResponse(nameof(GetById), new { id = tenant.Id }, tenant);
        }

        [HttpPut("{id:guid}")]
        [ProducesResponseType(typeof(ApiResponse<TenantViewModel>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<TenantViewModel>>> Update(
            Guid id, [FromBody] UpdateTenantViewModel model, CancellationToken cancellationToken)
        {
            if (id != model.Id)
            {
                return BadRequest(ApiResponse<object>.Fail("Route id and body id do not match", "400"));
            }

            var tenant = await _tenantService.UpdateAsync(model, cancellationToken);
            return tenant is null ? NotFoundResponse("Tenant not found") : OkResponse(tenant, "Tenant updated");
        }

        [HttpDelete("{id:guid}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id, CancellationToken cancellationToken)
        {
            var deleted = await _tenantService.DeleteAsync(id, cancellationToken);
            return deleted
                ? OkResponse<object>(new { id }, "Tenant deleted")
                : NotFoundResponse("Tenant not found");
        }

        [HttpPatch("{id:guid}/suspend")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<object>>> Suspend(Guid id, CancellationToken cancellationToken)
        {
            var updated = await _tenantService.SetActiveStateAsync(id, isActive: false, cancellationToken);
            return updated
                ? OkResponse<object>(new { id, isActive = false }, "Tenant suspended")
                : NotFoundResponse("Tenant not found");
        }

        [HttpPatch("{id:guid}/activate")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<object>>> Activate(Guid id, CancellationToken cancellationToken)
        {
            var updated = await _tenantService.SetActiveStateAsync(id, isActive: true, cancellationToken);
            return updated
                ? OkResponse<object>(new { id, isActive = true }, "Tenant activated")
                : NotFoundResponse("Tenant not found");
        }

        [HttpPatch("{tenantId:guid}/users/{userId:guid}/disable")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<object>>> DisableTenantUser(
            Guid tenantId, Guid userId, CancellationToken cancellationToken)
        {
            var updated = await _tenantService.SetUserActiveStateAsync(tenantId, userId, isActive: false, cancellationToken);
            return updated
                ? OkResponse<object>(new { tenantId, userId, isActive = false }, "Tenant user disabled")
                : NotFoundResponse("Tenant user not found");
        }
    }
}
