using Diskie.DataAccess.Model.Models.ViewModels;

namespace Diskie.API.Services.Coach
{
    public interface ICoachService
    {
        Task<CoachDashboardViewModel> GetDashboardAsync(CancellationToken cancellationToken = default);

        Task<IReadOnlyList<CoachTeamViewModel>> GetMyTeamsAsync(CancellationToken cancellationToken = default);

        Task<IReadOnlyList<RosterPlayerViewModel>?> GetRosterAsync(Guid teamId, CancellationToken cancellationToken = default);

        Task<IReadOnlyList<FixtureViewModel>> GetUpcomingFixturesAsync(CancellationToken cancellationToken = default);

        Task<IReadOnlyList<FixtureViewModel>> GetMatchHistoryAsync(Guid? teamId, CancellationToken cancellationToken = default);

        Task<IReadOnlyList<InjuryViewModel>> GetTeamInjuriesAsync(Guid? teamId, CancellationToken cancellationToken = default);

        Task<IReadOnlyList<AnnouncementViewModel>> GetAnnouncementsAsync(CancellationToken cancellationToken = default);

        Task<AnnouncementViewModel?> CreateAnnouncementAsync(CreateAnnouncementViewModel model, CancellationToken cancellationToken = default);
    }
}
