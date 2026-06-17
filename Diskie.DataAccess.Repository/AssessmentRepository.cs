using Diskie.DataAccess.Contracts;
using Diskie.DataAccess.Model.Models.DbModels;

namespace Diskie.DataAccess.Repository
{
    public class AssessmentRepository : RepositoryBase<Assessment>, IAssessmentRepository
    {
        public AssessmentRepository(DiskiDbContext repositoryContext) : base(repositoryContext)
        {
        }
    }
}
