using Diskie.DataAccess.Model.Models.DbModels;

namespace Diskie.API.Services.Coach
{
    public interface IMilestoneService
    {
        Task EvaluateAssessmentAsync(Assessment assessment, CancellationToken cancellationToken = default);
    }
}
