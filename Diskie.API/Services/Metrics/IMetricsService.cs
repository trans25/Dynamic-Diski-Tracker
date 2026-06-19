using Diskie.DataAccess.Model.Models.ViewModels;

namespace Diskie.API.Services.Metrics
{
    public interface IMetricsService
    {
        Task<MetricInsightsViewModel?> GetMatchInsightsAsync(Guid matchId, CancellationToken cancellationToken = default);
    }
}
