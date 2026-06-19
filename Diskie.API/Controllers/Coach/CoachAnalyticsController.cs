using Diskie.API.Security;
using Diskie.API.Services.Coach;
using Diskie.DataAccess.Model.Models.Common;
using Diskie.DataAccess.Model.Models.ViewModels;
using Microsoft.AspNetCore.Mvc;

namespace Diskie.API.Controllers.Coach
{
    [Route("api/coach/analytics")]
    public class CoachAnalyticsController : CoachControllerBase
    {
        private readonly ICoachService _coachService;

        public CoachAnalyticsController(ICoachService coachService, ICurrentUserContext currentUser)
            : base(currentUser)
        {
            _coachService = coachService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<CoachAnalyticsViewModel>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<CoachAnalyticsViewModel>>> Get(CancellationToken cancellationToken)
        {
            var analytics = await _coachService.GetAnalyticsAsync(cancellationToken);
            return OkResponse(analytics);
        }

        [HttpGet("metric-insights")]
        [ProducesResponseType(typeof(ApiResponse<MetricInsightsViewModel>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<MetricInsightsViewModel>>> GetMetricInsights(CancellationToken cancellationToken)
        {
            var insights = await _coachService.GetMetricInsightsAsync(cancellationToken);
            return OkResponse(insights);
        }
    }
}
