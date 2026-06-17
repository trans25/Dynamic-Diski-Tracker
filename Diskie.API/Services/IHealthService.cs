using Diskie.DataAccess.Model.Models.ViewModels;

namespace Diskie.API.Services
{
    public interface IHealthService
    {
        Task<SystemHealthViewModel> GetSummaryAsync(CancellationToken cancellationToken = default);
    }
}
