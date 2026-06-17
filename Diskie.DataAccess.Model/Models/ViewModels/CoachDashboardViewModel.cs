namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class CoachDashboardViewModel
    {
        public int TeamCount { get; set; }
        public int PlayerCount { get; set; }
        public int UpcomingFixtureCount { get; set; }
        public int ActiveInjuryCount { get; set; }
        public IReadOnlyList<CoachTeamViewModel> Teams { get; set; } = new List<CoachTeamViewModel>();
        public IReadOnlyList<FixtureViewModel> UpcomingFixtures { get; set; } = new List<FixtureViewModel>();
        public IReadOnlyList<AnnouncementViewModel> RecentAnnouncements { get; set; } = new List<AnnouncementViewModel>();
    }
}
