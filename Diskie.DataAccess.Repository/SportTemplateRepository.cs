using Diskie.DataAccess.Contracts;
using Diskie.DataAccess.Model.Models.DbModels;

namespace Diskie.DataAccess.Repository
{
    public class SportTemplateRepository : RepositoryBase<SportTemplate>, ISportTemplateRepository
    {
        public SportTemplateRepository(DiskiDbContext repositoryContext) : base(repositoryContext)
        {
        }
    }
}
