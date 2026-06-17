using Diskie.DataAccess.Contracts;
using Diskie.DataAccess.Model.Models.DbModels;

namespace Diskie.DataAccess.Repository
{
    public class GuardianMessagePreferenceRepository : RepositoryBase<GuardianMessagePreference>, IGuardianMessagePreferenceRepository
    {
        public GuardianMessagePreferenceRepository(DiskiDbContext repositoryContext) : base(repositoryContext)
        {
        }
    }
}
