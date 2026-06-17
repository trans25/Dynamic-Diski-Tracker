using Diskie.API.Mapping;
using Diskie.DataAccess.Contracts;
using Diskie.DataAccess.Model.Models.ViewModels;

namespace Diskie.API.Services
{
    public class BillingService : IBillingService
    {
        private readonly IRepositoryWrapper _repository;

        public BillingService(IRepositoryWrapper repository)
        {
            _repository = repository;
        }

        public Task<IReadOnlyList<TenantBillingViewModel>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            IReadOnlyList<TenantBillingViewModel> result = _repository.Tenant
                .FindAll()
                .OrderBy(t => t.Name)
                .Select(t => t.ToBillingViewModel())
                .ToList();

            return Task.FromResult(result);
        }

        public async Task<TenantBillingViewModel?> GetByTenantAsync(Guid tenantId, CancellationToken cancellationToken = default)
        {
            var tenant = await _repository.Tenant.GetByIdAsync(tenantId, cancellationToken);
            return tenant?.ToBillingViewModel();
        }

        public async Task<TenantBillingViewModel?> AssignPlanAsync(AssignBillingPlanViewModel model, CancellationToken cancellationToken = default)
        {
            var tenant = await _repository.Tenant.GetByIdAsync(model.TenantId, cancellationToken);
            if (tenant is null)
            {
                return null;
            }

            tenant.BillingPlan = model.BillingPlan;
            tenant.BillingPlanAssignedAt = DateTime.UtcNow;
            tenant.UpdatedAt = DateTime.UtcNow;

            _repository.Tenant.Update(tenant);
            await _repository.SaveAsync(cancellationToken);

            return tenant.ToBillingViewModel();
        }
    }
}
