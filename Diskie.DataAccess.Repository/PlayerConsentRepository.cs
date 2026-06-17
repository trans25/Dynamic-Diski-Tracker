using Diskie.DataAccess.Contracts;
using Diskie.DataAccess.Model.Models.DbModels;

namespace Diskie.DataAccess.Repository
{
    public class PlayerConsentRepository : RepositoryBase<PlayerConsent>, IPlayerConsentRepository
    {
        public PlayerConsentRepository(DiskiDbContext repositoryContext) : base(repositoryContext)
        {
        }
    }
}
