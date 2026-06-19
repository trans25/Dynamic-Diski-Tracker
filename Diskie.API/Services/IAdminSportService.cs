using Diskie.DataAccess.Model.Models.ViewModels;

namespace Diskie.API.Services
{
    public interface IAdminSportService
    {
        Task<IReadOnlyList<SportTemplateViewModel>> GetTemplatesAsync(CancellationToken cancellationToken = default);
        Task<IReadOnlyList<SportTemplateViewModel>> GetActiveTemplatesAsync(CancellationToken cancellationToken = default);
        Task<SportTemplateViewModel> CreateTemplateAsync(CreateSportTemplateViewModel model, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<PendingSportRequestViewModel>> GetPendingRequestsAsync(CancellationToken cancellationToken = default);
        Task<bool> ApproveRequestAsync(Guid requestId, CancellationToken cancellationToken = default);
        Task<bool> RejectRequestAsync(Guid requestId, CancellationToken cancellationToken = default);
    }
}