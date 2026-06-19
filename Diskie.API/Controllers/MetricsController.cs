using Diskie.API.Services.Metrics;
using Diskie.DataAccess.Model.Models.Common;
using Diskie.DataAccess.Model.Models.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Diskie.API.Controllers
{
    [ApiController]
    [Produces("application/json")]
    [Authorize]
    [Route("api/metrics")]
    public class MetricsController : ControllerBase
    {
        private readonly IMetricsService _metricsService;

        public MetricsController(IMetricsService metricsService)
        {
            _metricsService = metricsService;
        }

        [HttpGet("match/{matchId:guid}")]
        [ProducesResponseType(typeof(ApiResponse<MetricInsightsViewModel>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<MetricInsightsViewModel>>> GetMatchInsights(
            Guid matchId, CancellationToken cancellationToken)
        {
            var insights = await _metricsService.GetMatchInsightsAsync(matchId, cancellationToken);
            return insights is null
                ? NotFound(ApiResponse<object>.Fail("Match not found.", "404"))
                : Ok(ApiResponse<MetricInsightsViewModel>.Ok(insights));
        }
    }
}
