using System.ComponentModel.DataAnnotations;
using Diskie.DataAccess.Model.Models.Enums;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class UpdateInjuryViewModel
    {
        [Required]
        public Guid Id { get; set; }

        [Required]
        [StringLength(150)]
        public string InjuryType { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string BodyPart { get; set; } = string.Empty;

        [Required]
        public InjurySeverity Severity { get; set; }

        public DateOnly? EstimatedReturnDate { get; set; }
        public DateOnly? ActualReturnDate { get; set; }

        [Required]
        public InjuryStatus Status { get; set; }

        [StringLength(2000)]
        public string? MedicalNotes { get; set; }

        [StringLength(2000)]
        public string? TreatmentNotes { get; set; }
    }
}
