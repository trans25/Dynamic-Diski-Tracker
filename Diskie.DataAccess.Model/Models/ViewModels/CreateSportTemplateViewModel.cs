using System.ComponentModel.DataAnnotations;
using Diskie.DataAccess.Model.Models.DbModels;
using Diskie.DataAccess.Model.Models.Enums;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class CreateSportTemplateViewModel
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(150)]
        public string DisplayName { get; set; } = string.Empty;

        public SportType SportType { get; set; } = SportType.Football;

        [StringLength(100)]
        public string? Icon { get; set; }

        [StringLength(1000)]
        public string? Description { get; set; }

        public string MetricDefinitions { get; set; } = "[]";
        public string PositionDefinitions { get; set; } = "[]";

        public List<AssessmentMetric> AssessmentMetrics { get; set; } = new();
        public List<MatchStatField> MatchStatsFields { get; set; } = new();
        public List<string>? PositionOptions { get; set; }
        public int? DefaultSeasonWeeks { get; set; }
    }
}
