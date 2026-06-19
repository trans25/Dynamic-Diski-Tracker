using Diskie.DataAccess.Model.Models.ViewModels;

namespace Diskie.API.Services
{
    public interface ITenantService
    {
        Task<IReadOnlyList<TenantViewModel>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<IReadOnlyList<TenantViewModel>> GetPendingAsync(CancellationToken cancellationToken = default);
        Task<TenantViewModel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
        Task<TenantViewModel> CreateAsync(CreateTenantViewModel model, CancellationToken cancellationToken = default);
        Task<TenantViewModel?> UpdateAsync(UpdateTenantViewModel model, CancellationToken cancellationToken = default);
        Task<TenantDeleteResult> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
        Task<bool> ApproveAsync(Guid id, CancellationToken cancellationToken = default);
        Task<bool> SetActiveStateAsync(Guid id, bool isActive, CancellationToken cancellationToken = default);
        Task<bool> SetUserActiveStateAsync(Guid tenantId, Guid userId, bool isActive, CancellationToken cancellationToken = default);
    }
}
