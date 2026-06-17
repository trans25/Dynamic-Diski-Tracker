using Diskie.DataAccess.Contracts;
using Diskie.DataAccess.Model.Models.DbModels;

namespace Diskie.DataAccess.Repository
{
    public class TeamPlayerRepository : RepositoryBase<TeamPlayer>, ITeamPlayerRepository
    {
        public TeamPlayerRepository(DiskiDbContext repositoryContext) : base(repositoryContext)
        {
        }
    }
}
