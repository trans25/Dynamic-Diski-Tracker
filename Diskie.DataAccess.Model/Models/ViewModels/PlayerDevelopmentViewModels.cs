namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class PlayerSkillRadarPointViewModel
    {
        public string Skill { get; set; } = string.Empty;
        public double PlayerValue { get; set; }
        public double SquadAverage { get; set; }
    }

    public class PlayerSkillsViewModel
    {
        public Guid PlayerId { get; set; }
        public string PlayerName { get; set; } = string.Empty;
        public string Season { get; set; } = string.Empty;
        public List<PlayerSkillRadarPointViewModel> Points { get; set; } = new();
    }

    public class MarkTrainingAttendanceViewModel
    {
        public Guid PlayerId { get; set; }
        public DateOnly SessionDate { get; set; }
        public bool IsPresent { get; set; }
        public bool IsLate { get; set; }
    }

    public class SquadAttendanceSummaryViewModel
    {
        public Guid PlayerId { get; set; }
        public string PlayerName { get; set; } = string.Empty;
        public double AttendancePercentage { get; set; }
        public int PresentSessions { get; set; }
        public int TotalSessions { get; set; }
        public bool? IsPresentForSession { get; set; }
        public bool? IsLateForSession { get; set; }
    }

    public class PlayerAchievementViewModel
    {
        public Guid Id { get; set; }
        public Guid PlayerId { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string IconKey { get; set; } = string.Empty;
        public DateTime AwardedAt { get; set; }
    }
}
