using Diskie.DataAccess.Contracts;
using Diskie.DataAccess.Model.Models.DbModels;

namespace Diskie.DataAccess.Repository
{
    public class TeamCoachRepository : RepositoryBase<TeamCoach>, ITeamCoachRepository
    {
        public TeamCoachRepository(DiskiDbContext repositoryContext) : base(repositoryContext)
        {
        }
    }
}
