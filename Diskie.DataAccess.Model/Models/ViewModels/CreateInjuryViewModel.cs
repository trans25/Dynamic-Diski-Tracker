using System.ComponentModel.DataAnnotations;
using Diskie.DataAccess.Model.Models.Enums;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class CreateInjuryViewModel
    {
        [Required]
        public Guid PlayerId { get; set; }

        [Required]
        [StringLength(150)]
        public string InjuryType { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string BodyPart { get; set; } = string.Empty;

        [Required]
        public InjurySeverity Severity { get; set; }

        [Required]
        public DateOnly OccurredAt { get; set; }

        public DateOnly? EstimatedReturnDate { get; set; }

        [StringLength(2000)]
        public string? MedicalNotes { get; set; }

        [StringLength(2000)]
        public string? TreatmentNotes { get; set; }

        public Guid? ReportedBy { get; set; }
        public bool IsMatchInjury { get; set; }
        public Guid? FixtureId { get; set; }
    }
}
