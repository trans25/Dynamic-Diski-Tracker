using Diskie.API.Mapping;
using Diskie.DataAccess.Contracts;
using Diskie.DataAccess.Model.Models.DbModels;
using Diskie.DataAccess.Model.Models.ViewModels;

namespace Diskie.API.Services
{
    public class TemplateService : ITemplateService
    {
        private readonly IRepositoryWrapper _repository;

        public TemplateService(IRepositoryWrapper repository)
        {
            _repository = repository;
        }

        public Task<IReadOnlyList<SportTemplateViewModel>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            IReadOnlyList<SportTemplateViewModel> result = _repository.SportTemplate
                .FindAll()
                .OrderBy(t => t.Name)
                .Select(t => t.ToViewModel())
                .ToList();

            return Task.FromResult(result);
        }

        public async Task<SportTemplateViewModel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var template = await _repository.SportTemplate.GetByIdAsync(id, cancellationToken);
            return template?.ToViewModel();
        }

        public async Task<SportTemplateViewModel> CreateAsync(CreateSportTemplateViewModel model, CancellationToken cancellationToken = default)
        {
            var template = new SportTemplate
            {
                Id = Guid.NewGuid(),
                Name = model.Name,
                DisplayName = model.DisplayName,
                Icon = model.Icon,
                Description = model.Description,
                AssessmentMetrics = model.AssessmentMetrics,
                MatchStatsFields = model.MatchStatsFields,
                PositionOptions = model.PositionOptions,
                DefaultSeasonWeeks = model.DefaultSeasonWeeks,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _repository.SportTemplate.Create(template);
            await _repository.SaveAsync(cancellationToken);

            return template.ToViewModel();
        }

        public async Task<SportTemplateViewModel?> UpdateAsync(UpdateSportTemplateViewModel model, CancellationToken cancellationToken = default)
        {
            var template = await _repository.SportTemplate.GetByIdAsync(model.Id, cancellationToken);
            if (template is null)
            {
                return null;
            }

            template.Name = model.Name;
            template.DisplayName = model.DisplayName;
            template.Icon = model.Icon;
            template.Description = model.Description;
            template.AssessmentMetrics = model.AssessmentMetrics;
            template.MatchStatsFields = model.MatchStatsFields;
            template.PositionOptions = model.PositionOptions;
            template.DefaultSeasonWeeks = model.DefaultSeasonWeeks;
            template.IsActive = model.IsActive;
            template.UpdatedAt = DateTime.UtcNow;

            _repository.SportTemplate.Update(template);
            await _repository.SaveAsync(cancellationToken);

            return template.ToViewModel();
        }

        public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var template = await _repository.SportTemplate.GetByIdAsync(id, cancellationToken);
            if (template is null)
            {
                return false;
            }

            _repository.SportTemplate.Delete(template);
            await _repository.SaveAsync(cancellationToken);
            return true;
        }
    }
}
