using Diskie.DataAccess.Contracts;
using Diskie.DataAccess.Model.Models.DbModels;

namespace Diskie.DataAccess.Repository
{
    public class AvailabilityRepository : RepositoryBase<Availability>, IAvailabilityRepository
    {
        public AvailabilityRepository(DiskiDbContext repositoryContext) : base(repositoryContext)
        {
        }
    }
}
