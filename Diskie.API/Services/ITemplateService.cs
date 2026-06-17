using Diskie.DataAccess.Model.Models.ViewModels;

namespace Diskie.API.Services
{
    public interface ITemplateService
    {
        Task<IReadOnlyList<SportTemplateViewModel>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<SportTemplateViewModel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
        Task<SportTemplateViewModel> CreateAsync(CreateSportTemplateViewModel model, CancellationToken cancellationToken = default);
        Task<SportTemplateViewModel?> UpdateAsync(UpdateSportTemplateViewModel model, CancellationToken cancellationToken = default);
        Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    }
}
