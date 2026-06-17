using Diskie.DataAccess.Model.DbModels;
using Diskie.DataAccess.Model.Models.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Diskie.DataAccess.Model.Models.DbModels
{
    public class Injury : SharedModel
    {
        public Guid PlayerId { get; set; }
        public string InjuryType { get; set; } = null!;
        public string BodyPart { get; set; } = null!;
        public InjurySeverity Severity { get; set; }
        public DateOnly OccurredAt { get; set; }
        public DateOnly? EstimatedReturnDate { get; set; }
        public DateOnly? ActualReturnDate { get; set; }
        public InjuryStatus Status { get; set; } = InjuryStatus.Active;
        public string? MedicalNotes { get; set; }
        public string? TreatmentNotes { get; set; }
        public Guid? ReportedBy { get; set; }
        public bool IsMatchInjury { get; set; }
        public Guid? FixtureId { get; set; }

        public User Player { get; set; } = null!;
        public User? Reporter { get; set; }
        public Fixture? Fixture { get; set; }
    }
}
