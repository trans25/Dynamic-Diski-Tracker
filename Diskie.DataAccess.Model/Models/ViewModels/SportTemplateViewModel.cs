using Diskie.DataAccess.Model.Models.DbModels;
using Diskie.DataAccess.Model.Models.Enums;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class SportTemplateViewModel
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public SportType SportType { get; set; }
        public string? Icon { get; set; }
        public string? Description { get; set; }
        public string MetricDefinitions { get; set; } = "[]";
        public string PositionDefinitions { get; set; } = "[]";
        public List<AssessmentMetric> AssessmentMetrics { get; set; } = new();
        public List<MatchStatField> MatchStatsFields { get; set; } = new();
        public List<string>? PositionOptions { get; set; }
        public int? DefaultSeasonWeeks { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
