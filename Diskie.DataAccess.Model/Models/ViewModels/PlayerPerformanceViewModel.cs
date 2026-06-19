namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class PlayerPerformanceViewModel
    {
        public Guid PlayerId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? ProfilePhotoUrl { get; set; }
        public int? JerseyNumber { get; set; }
        public string? Position { get; set; }

        public int TotalSessions { get; set; }
        public int SessionsAttended { get; set; }
        public double AttendanceRate { get; set; }

        public int AssessmentCount { get; set; }
        public double? AverageRating { get; set; }

        public bool HasActiveInjury { get; set; }
        public int InjuryCount { get; set; }

        public IReadOnlyList<InjuryViewModel> RecentInjuries { get; set; } = new List<InjuryViewModel>();
        public IReadOnlyList<PlayerAssessmentViewModel> RecentAssessments { get; set; } = new List<PlayerAssessmentViewModel>();
    }

    public class PlayerAssessmentViewModel
    {
        public Guid Id { get; set; }
        public Guid PlayerId { get; set; }
        public Guid CoachId { get; set; }
        public Guid TeamId { get; set; }
        public DateOnly AssessmentDate { get; set; }
        public string? FreeText { get; set; }
        public int? OverallRating { get; set; }
        public bool IsMatchAssessment { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
