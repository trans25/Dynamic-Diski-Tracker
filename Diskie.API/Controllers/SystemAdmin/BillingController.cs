using Diskie.API.Services;
using Diskie.DataAccess.Model.Models.Common;
using Diskie.DataAccess.Model.Models.ViewModels;
using Microsoft.AspNetCore.Mvc;

namespace Diskie.API.Controllers.SystemAdmin
{
    [Route("api/admin/billing")]
    public class BillingController : SuperAdminControllerBase
    {
        private readonly IBillingService _billingService;

        public BillingController(IBillingService billingService)
        {
            _billingService = billingService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<TenantBillingViewModel>>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<TenantBillingViewModel>>>> GetAll(CancellationToken cancellationToken)
        {
            var billing = await _billingService.GetAllAsync(cancellationToken);
            return OkResponse(billing);
        }

        [HttpGet("{tenantId:guid}")]
        [ProducesResponseType(typeof(ApiResponse<TenantBillingViewModel>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<TenantBillingViewModel>>> GetByTenant(Guid tenantId, CancellationToken cancellationToken)
        {
            var billing = await _billingService.GetByTenantAsync(tenantId, cancellationToken);
            return billing is null ? NotFoundResponse("Tenant not found") : OkResponse(billing);
        }

        [HttpPut("plan")]
        [ProducesResponseType(typeof(ApiResponse<TenantBillingViewModel>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<TenantBillingViewModel>>> AssignPlan(
            [FromBody] AssignBillingPlanViewModel model, CancellationToken cancellationToken)
        {
            var billing = await _billingService.AssignPlanAsync(model, cancellationToken);
            return billing is null ? NotFoundResponse("Tenant not found") : OkResponse(billing, "Billing plan assigned");
        }
    }
}
