using Diskie.DataAccess.Model.Models.ViewModels;

namespace Diskie.API.Services
{
    public interface ISuperAdminService
    {
        Task<UserViewModel?> GetProfileAsync(Guid userId, CancellationToken cancellationToken = default);
        Task<SuperAdminDashboardViewModel> GetDashboardAsync(CancellationToken cancellationToken = default);
    }
}
