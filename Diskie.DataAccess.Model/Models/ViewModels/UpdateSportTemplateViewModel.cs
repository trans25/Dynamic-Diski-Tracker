using System.ComponentModel.DataAnnotations;
using Diskie.DataAccess.Model.Models.DbModels;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class UpdateSportTemplateViewModel
    {
        [Required]
        public Guid Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(150)]
        public string DisplayName { get; set; } = string.Empty;

        [StringLength(100)]
        public string? Icon { get; set; }

        [StringLength(1000)]
        public string? Description { get; set; }

        public List<AssessmentMetric> AssessmentMetrics { get; set; } = new();
        public List<MatchStatField> MatchStatsFields { get; set; } = new();
        public List<string>? PositionOptions { get; set; }
        public int? DefaultSeasonWeeks { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
