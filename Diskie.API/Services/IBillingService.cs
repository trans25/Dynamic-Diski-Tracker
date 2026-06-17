using Diskie.DataAccess.Model.Models.ViewModels;

namespace Diskie.API.Services
{
    public interface IBillingService
    {
        Task<IReadOnlyList<TenantBillingViewModel>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<TenantBillingViewModel?> GetByTenantAsync(Guid tenantId, CancellationToken cancellationToken = default);
        Task<TenantBillingViewModel?> AssignPlanAsync(AssignBillingPlanViewModel model, CancellationToken cancellationToken = default);
    }
}
