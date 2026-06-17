using System.ComponentModel.DataAnnotations;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class UpdateAssessmentViewModel
    {
        [Required]
        public Guid Id { get; set; }

        [Required]
        public DateOnly AssessmentDate { get; set; }

        public Dictionary<string, object> Metrics { get; set; } = new();

        [StringLength(4000)]
        public string? FreeText { get; set; }

        [Range(1, 5)]
        public int? OverallRating { get; set; }

        public bool IsMatchAssessment { get; set; }
    }
}
