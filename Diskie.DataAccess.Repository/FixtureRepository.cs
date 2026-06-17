using Diskie.DataAccess.Contracts;
using Diskie.DataAccess.Model.Models.DbModels;

namespace Diskie.DataAccess.Repository
{
    public class FixtureRepository : RepositoryBase<Fixture>, IFixtureRepository
    {
        public FixtureRepository(DiskiDbContext repositoryContext) : base(repositoryContext)
        {
        }
    }
}
