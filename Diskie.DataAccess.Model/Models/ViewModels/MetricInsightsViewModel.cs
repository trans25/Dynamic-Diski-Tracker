namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class MetricInsightsViewModel
    {
        public string Formation { get; set; } = string.Empty;
        public string Advice { get; set; } = string.Empty;

        /// <summary>Current form expressed as a percentage (0-100).</summary>
        public double FormScore { get; set; }

        /// <summary>Head-to-head record expressed as a percentage (0-100).</summary>
        public double H2HScore { get; set; }

        public Guid? StarPlayerId { get; set; }
        public string StarPlayerName { get; set; } = "N/A";
        public double StarPlayerMetricScore { get; set; }
        public string? StarPlayerSummary { get; set; }
    }
}
