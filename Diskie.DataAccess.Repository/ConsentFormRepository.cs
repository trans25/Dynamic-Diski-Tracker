using Diskie.DataAccess.Contracts;
using Diskie.DataAccess.Model.Models.DbModels;

namespace Diskie.DataAccess.Repository
{
    public class ConsentFormRepository : RepositoryBase<ConsentForm>, IConsentFormRepository
    {
        public ConsentFormRepository(DiskiDbContext repositoryContext) : base(repositoryContext)
        {
        }
    }
}
