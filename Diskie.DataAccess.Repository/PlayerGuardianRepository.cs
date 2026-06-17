using Diskie.DataAccess.Contracts;
using Diskie.DataAccess.Model.Models.DbModels;

namespace Diskie.DataAccess.Repository
{
    public class PlayerGuardianRepository : RepositoryBase<PlayerGuardian>, IPlayerGuardianRepository
    {
        public PlayerGuardianRepository(DiskiDbContext repositoryContext) : base(repositoryContext)
        {
        }
    }
}
