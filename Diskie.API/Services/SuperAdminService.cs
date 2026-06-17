using Diskie.API.Mapping;
using Diskie.DataAccess.Contracts;
using Diskie.DataAccess.Model.Models.Enums;
using Diskie.DataAccess.Model.Models.ViewModels;

namespace Diskie.API.Services
{
    public class SuperAdminService : ISuperAdminService
    {
        private readonly IRepositoryWrapper _repository;

        public SuperAdminService(IRepositoryWrapper repository)
        {
            _repository = repository;
        }

        public async Task<UserViewModel?> GetProfileAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            var user = await _repository.User.GetByIdAsync(userId, cancellationToken);
            return user?.ToViewModel();
        }

        public Task<SuperAdminDashboardViewModel> GetDashboardAsync(CancellationToken cancellationToken = default)
        {
            var tenants = _repository.Tenant.FindAll().ToList();
            var users = _repository.User.FindAll().ToList();
            var templates = _repository.SportTemplate.FindAll().ToList();

            var dashboard = new SuperAdminDashboardViewModel
            {
                TotalTenants = tenants.Count,
                ActiveTenants = tenants.Count(t => t.IsActive),
                SuspendedTenants = tenants.Count(t => !t.IsActive),
                TotalUsers = users.Count,
                ActiveUsers = users.Count(u => u.IsActive),
                TotalSportTemplates = templates.Count,
                TenantsByBillingPlan = tenants
                    .GroupBy(t => t.BillingPlan)
                    .ToDictionary(g => g.Key.ToString(), g => g.Count()),
                UsersByRole = users
                    .GroupBy(u => u.Role)
                    .ToDictionary(g => g.Key.ToString(), g => g.Count())
            };

            return Task.FromResult(dashboard);
        }
    }
}
