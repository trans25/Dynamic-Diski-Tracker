using System.ComponentModel.DataAnnotations;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class CreateAssessmentViewModel
    {
        [Required]
        public Guid PlayerId { get; set; }

        [Required]
        public Guid CoachId { get; set; }

        [Required]
        public Guid TeamId { get; set; }

        [Required]
        public Guid SportTemplateId { get; set; }

        [Required]
        public DateOnly AssessmentDate { get; set; }

        public Dictionary<string, object> Metrics { get; set; } = new();

        [StringLength(4000)]
        public string? FreeText { get; set; }

        [Range(1, 5)]
        public int? OverallRating { get; set; }

        public bool IsMatchAssessment { get; set; }
        public Guid? FixtureId { get; set; }
    }
}
