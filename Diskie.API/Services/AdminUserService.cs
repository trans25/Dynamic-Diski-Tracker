using Diskie.API.Mapping;
using Diskie.DataAccess.Contracts;
using Diskie.DataAccess.Model.Models.ViewModels;

namespace Diskie.API.Services
{
    public class AdminUserService : IAdminUserService
    {
        private readonly IRepositoryWrapper _repository;

        public AdminUserService(IRepositoryWrapper repository)
        {
            _repository = repository;
        }

        public Task<IReadOnlyList<UserViewModel>> GetAllAsync(Guid? tenantId, CancellationToken cancellationToken = default)
        {
            var query = _repository.User.FindAll();

            if (tenantId.HasValue)
            {
                query = query.Where(u => u.TenantId == tenantId.Value);
            }

            IReadOnlyList<UserViewModel> result = query
                .OrderBy(u => u.LastName)
                .Select(u => u.ToViewModel())
                .ToList();

            return Task.FromResult(result);
        }

        public async Task<UserViewModel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var user = await _repository.User.GetByIdAsync(id, cancellationToken);
            return user?.ToViewModel();
        }

        public async Task<UserViewModel?> AssignRoleAsync(AssignRoleViewModel model, CancellationToken cancellationToken = default)
        {
            var user = await _repository.User.GetByIdAsync(model.UserId, cancellationToken);
            if (user is null)
            {
                return null;
            }

            user.Role = model.Role;
            user.UpdatedAt = DateTime.UtcNow;
            _repository.User.Update(user);
            await _repository.SaveAsync(cancellationToken);

            return user.ToViewModel();
        }

        public async Task<bool> SetActiveStateAsync(Guid id, bool isActive, CancellationToken cancellationToken = default)
        {
            var user = await _repository.User.GetByIdAsync(id, cancellationToken);
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
