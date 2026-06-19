namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class CoachAnalyticsViewModel
    {
        public int TeamCount { get; set; }
        public int PlayerCount { get; set; }

        public int TotalMatches { get; set; }
        public int Wins { get; set; }
        public int Losses { get; set; }
        public int Draws { get; set; }
        public double WinRate { get; set; }

        public double OverallAttendanceRate { get; set; }

        public int ActiveInjuryCount { get; set; }
        public int TotalInjuryCount { get; set; }

        public IReadOnlyList<TeamAnalyticsViewModel> Teams { get; set; } = new List<TeamAnalyticsViewModel>();
    }

    public class TeamAnalyticsViewModel
    {
        public Guid TeamId { get; set; }
        public string TeamName { get; set; } = string.Empty;
        public int PlayerCount { get; set; }
        public int Matches { get; set; }
        public int Wins { get; set; }
        public int Losses { get; set; }
        public int Draws { get; set; }
        public double WinRate { get; set; }
        public double AttendanceRate { get; set; }
        public int ActiveInjuryCount { get; set; }
    }
}
