using Diskie.DataAccess.Contracts;
using Diskie.DataAccess.Model.DbModels;

namespace Diskie.DataAccess.Repository
{
    public class UserRepository : RepositoryBase<User>, IUserRepository
    {
        public UserRepository(DiskiDbContext repositoryContext) : base(repositoryContext)
        {
        }
    }
}
