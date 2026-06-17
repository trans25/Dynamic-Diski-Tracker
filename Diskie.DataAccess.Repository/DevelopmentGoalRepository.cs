using Diskie.DataAccess.Contracts;
using Diskie.DataAccess.Model.Models.DbModels;

namespace Diskie.DataAccess.Repository
{
    public class DevelopmentGoalRepository : RepositoryBase<DevelopmentGoal>, IDevelopmentGoalRepository
    {
        public DevelopmentGoalRepository(DiskiDbContext repositoryContext) : base(repositoryContext)
        {
        }
    }
}
