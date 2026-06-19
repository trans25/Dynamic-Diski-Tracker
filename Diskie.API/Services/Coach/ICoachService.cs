using Diskie.DataAccess.Model.Models.ViewModels;

namespace Diskie.API.Services.Coach
{
    public interface ICoachService
    {
        Task<CoachDashboardViewModel> GetDashboardAsync(CancellationToken cancellationToken = default);

        Task<IReadOnlyList<CoachTeamViewModel>> GetMyTeamsAsync(CancellationToken cancellationToken = default);

        Task<IReadOnlyList<SportTemplateViewModel>> GetSportTemplatesAsync(CancellationToken cancellationToken = default);

        Task<CoachTeamMutationResult> CreateTeamAsync(CreateCoachTeamViewModel model, CancellationToken cancellationToken = default);

        Task<CoachTeamMutationResult> UpdateTeamAsync(UpdateCoachTeamViewModel model, CancellationToken cancellationToken = default);

        Task<CoachTeamDeleteResult> DeleteTeamAsync(Guid teamId, CancellationToken cancellationToken = default);

        Task<IReadOnlyList<RosterPlayerViewModel>?> GetRosterAsync(Guid teamId, CancellationToken cancellationToken = default);

        Task<RosterPlayerViewModel?> AddPlayerAsync(Guid teamId, CreateRosterPlayerViewModel model, CancellationToken cancellationToken = default);

        Task<RosterPlayerViewModel?> UpdatePlayerAsync(Guid teamId, Guid playerId, UpdateRosterPlayerViewModel model, CancellationToken cancellationToken = default);

        Task<bool> RemovePlayerAsync(Guid teamId, Guid playerId, CancellationToken cancellationToken = default);

        Task<ImportPlayersResultViewModel?> ImportPlayersAsync(Guid teamId, ImportPlayersViewModel model, CancellationToken cancellationToken = default);

        Task<GuardianInviteResultViewModel?> InviteGuardianAsync(InviteGuardianViewModel model, CancellationToken cancellationToken = default);

        Task<PlayerPerformanceViewModel?> GetPlayerPerformanceAsync(Guid playerId, CancellationToken cancellationToken = default);

        Task<IReadOnlyList<FixtureViewModel>> GetUpcomingFixturesAsync(CancellationToken cancellationToken = default);

        Task<IReadOnlyList<FixtureViewModel>> GetMatchHistoryAsync(Guid? teamId, CancellationToken cancellationToken = default);

        Task<FixtureViewModel?> CreateMatchAsync(CreateFixtureViewModel model, CancellationToken cancellationToken = default);

        Task<FixtureViewModel?> UpdateMatchAsync(UpdateFixtureViewModel model, CancellationToken cancellationToken = default);

        Task<FixtureViewModel?> CancelMatchAsync(Guid fixtureId, CancellationToken cancellationToken = default);

        Task<bool> DeleteMatchAsync(Guid fixtureId, CancellationToken cancellationToken = default);

        Task<IReadOnlyList<InjuryViewModel>> GetTeamInjuriesAsync(Guid? teamId, CancellationToken cancellationToken = default);

        Task<InjuryViewModel?> CreateInjuryAsync(CreateInjuryViewModel model, CancellationToken cancellationToken = default);

        Task<InjuryViewModel?> UpdateInjuryAsync(UpdateInjuryViewModel model, CancellationToken cancellationToken = default);

        Task<bool> DeleteInjuryAsync(Guid injuryId, CancellationToken cancellationToken = default);

        Task<CoachAnalyticsViewModel> GetAnalyticsAsync(CancellationToken cancellationToken = default);

        Task<MetricInsightsViewModel> GetMetricInsightsAsync(CancellationToken cancellationToken = default);

        Task<LiveMatchViewModel?> GetLiveMatchAsync(Guid matchId, CancellationToken cancellationToken = default);

        Task<MatchEventViewModel?> PostLiveMatchEventAsync(Guid matchId, CreateMatchEventViewModel model, CancellationToken cancellationToken = default);

        Task<IReadOnlyList<AnnouncementViewModel>> GetAnnouncementsAsync(CancellationToken cancellationToken = default);

        Task<AnnouncementViewModel?> CreateAnnouncementAsync(CreateAnnouncementViewModel model, CancellationToken cancellationToken = default);

        Task<AnnouncementViewModel?> UpdateAnnouncementAsync(UpdateAnnouncementViewModel model, CancellationToken cancellationToken = default);

        Task<bool> DeleteAnnouncementAsync(Guid announcementId, CancellationToken cancellationToken = default);
    }
}
