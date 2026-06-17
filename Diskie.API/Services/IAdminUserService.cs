using Diskie.DataAccess.Model.Models.ViewModels;

namespace Diskie.API.Services
{
    public interface IAdminUserService
    {
        Task<IReadOnlyList<UserViewModel>> GetAllAsync(Guid? tenantId, CancellationToken cancellationToken = default);
        Task<UserViewModel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
        Task<UserViewModel?> AssignRoleAsync(AssignRoleViewModel model, CancellationToken cancellationToken = default);
        Task<bool> SetActiveStateAsync(Guid id, bool isActive, CancellationToken cancellationToken = default);
    }
}
