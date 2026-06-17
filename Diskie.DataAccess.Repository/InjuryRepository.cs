using Diskie.DataAccess.Contracts;
using Diskie.DataAccess.Model.Models.DbModels;

namespace Diskie.DataAccess.Repository
{
    public class InjuryRepository : RepositoryBase<Injury>, IInjuryRepository
    {
        public InjuryRepository(DiskiDbContext repositoryContext) : base(repositoryContext)
        {
        }
    }
}
