using Diskie.DataAccess.Model.Models.Enums;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class InjuryViewModel
    {
        public Guid Id { get; set; }
        public Guid PlayerId { get; set; }
        public string InjuryType { get; set; } = string.Empty;
        public string BodyPart { get; set; } = string.Empty;
        public InjurySeverity Severity { get; set; }
        public DateOnly OccurredAt { get; set; }
        public DateOnly? EstimatedReturnDate { get; set; }
        public DateOnly? ActualReturnDate { get; set; }
        public InjuryStatus Status { get; set; }
        public string? MedicalNotes { get; set; }
        public string? TreatmentNotes { get; set; }
        public Guid? ReportedBy { get; set; }
        public bool IsMatchInjury { get; set; }
        public Guid? FixtureId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
