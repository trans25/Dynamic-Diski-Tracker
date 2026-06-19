using Diskie.API.Mapping;
using Diskie.DataAccess.Contracts;
using Diskie.DataAccess.Model.Models.DbModels;
using Diskie.DataAccess.Model.Models.ViewModels;

namespace Diskie.API.Services
{
    public class TenantService : ITenantService
    {
        private readonly IRepositoryWrapper _repository;

        public TenantService(IRepositoryWrapper repository)
        {
            _repository = repository;
        }

        public Task<IReadOnlyList<TenantViewModel>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            IReadOnlyList<TenantViewModel> result = _repository.Tenant
                .FindAll()
                .OrderBy(t => t.Name)
                .Select(t => t.ToViewModel())
                .ToList();

            return Task.FromResult(result);
        }

        public Task<IReadOnlyList<TenantViewModel>> GetPendingAsync(CancellationToken cancellationToken = default)
        {
            IReadOnlyList<TenantViewModel> result = _repository.Tenant
                .FindByCondition(t => !t.IsApproved)
                .OrderBy(t => t.CreatedAt)
                .Select(t => t.ToViewModel())
                .ToList();

            return Task.FromResult(result);
        }

        public async Task<TenantViewModel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var tenant = await _repository.Tenant.GetByIdAsync(id, cancellationToken);
            return tenant?.ToViewModel();
        }

        public async Task<TenantViewModel> CreateAsync(CreateTenantViewModel model, CancellationToken cancellationToken = default)
        {
            var tenant = new Tenant
            {
                Id = Guid.NewGuid(),
                Name = model.Name,
                Address = model.Address,
                City = model.City,
                Province = model.Province,
                Phone = model.Phone,
                Email = model.Email,
                LogoUrl = model.LogoUrl,
                AssignedSportTemplateId = model.AssignedSportTemplateId,
                IsActive = true,
                IsApproved = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _repository.Tenant.Create(tenant);
            await _repository.SaveAsync(cancellationToken);

            return tenant.ToViewModel();
        }

        public async Task<TenantViewModel?> UpdateAsync(UpdateTenantViewModel model, CancellationToken cancellationToken = default)
        {
            var tenant = await _repository.Tenant.GetByIdAsync(model.Id, cancellationToken);
            if (tenant is null)
            {
                return null;
            }

            tenant.Name = model.Name;
            tenant.Address = model.Address;
            tenant.City = model.City;
            tenant.Province = model.Province;
            tenant.Phone = model.Phone;
            tenant.Email = model.Email;
            tenant.LogoUrl = model.LogoUrl;
            tenant.AssignedSportTemplateId = model.AssignedSportTemplateId;
            tenant.IsActive = model.IsActive;
            tenant.IsApproved = model.IsApproved;
            tenant.UpdatedAt = DateTime.UtcNow;

            _repository.Tenant.Update(tenant);
            await _repository.SaveAsync(cancellationToken);

            return tenant.ToViewModel();
        }

        public async Task<TenantDeleteResult> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var tenant = await _repository.Tenant.GetByIdAsync(id, cancellationToken);
            if (tenant is null)
            {
                return TenantDeleteResult.NotFound;
            }

            var hasUsers = _repository.User
                .FindByCondition(u => u.TenantId == id)
                .Any();

            if (hasUsers)
            {
                return TenantDeleteResult.HasDependents;
            }

            _repository.Tenant.Delete(tenant);
            await _repository.SaveAsync(cancellationToken);
            return TenantDeleteResult.Deleted;
        }

        public async Task<bool> ApproveAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var tenant = await _repository.Tenant.GetByIdAsync(id, cancellationToken);
            if (tenant is null)
            {
                return false;
            }

            tenant.IsApproved = true;
            tenant.IsActive = true;
            tenant.UpdatedAt = DateTime.UtcNow;
            _repository.Tenant.Update(tenant);
            await _repository.SaveAsync(cancellationToken);
            return true;
        }

        public async Task<bool> SetActiveStateAsync(Guid id, bool isActive, CancellationToken cancellationToken = default)
        {
            var tenant = await _repository.Tenant.GetByIdAsync(id, cancellationToken);
            if (tenant is null)
            {
                return false;
            }

            tenant.IsActive = isActive;
            tenant.UpdatedAt = DateTime.UtcNow;
            _repository.Tenant.Update(tenant);
            await _repository.SaveAsync(cancellationToken);
            return true;
        }

        public async Task<bool> SetUserActiveStateAsync(Guid tenantId, Guid userId, bool isActive, CancellationToken cancellationToken = default)
        {
            var user = _repository.User
                .FindByCondition(u => u.Id == userId && u.TenantId == tenantId, trackChanges: true)
                .FirstOrDefault();

            if (user is null)
            {
                return false;
            }

            user.IsActive = isActive;
            user.UpdatedAt = DateTime.UtcNow;
            _repository.User.Update(user);
            await _repository.SaveAsync(cancellationToken);
            return true;
        }
    }
}
