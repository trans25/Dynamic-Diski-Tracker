using Diskie.DataAccess.Model.Models.ViewModels;
using Microsoft.AspNetCore.Http;

namespace Diskie.API.Services.Coach
{
    public interface ICoachOperationsService
    {
        Task<IReadOnlyList<MatchAvailabilityItemViewModel>> GetMatchAvailabilityAsync(Guid matchId, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<MatchAvailabilityItemViewModel>> RequestAvailabilityAsync(Guid matchId, IReadOnlyList<Guid> playerIds, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<MatchAvailabilityItemViewModel>> UpdateAvailabilityAsync(Guid matchId, IReadOnlyList<UpdateAvailabilityItemViewModel> players, CancellationToken cancellationToken = default);

        Task<IReadOnlyList<InjuryViewModel>> GetPlayerInjuriesAsync(Guid playerId, CancellationToken cancellationToken = default);
        Task<InjuryViewModel?> CreatePlayerInjuryAsync(CreateInjuryViewModel model, CancellationToken cancellationToken = default);

        Task<TacticalLayoutViewModel?> GetTacticalLayoutAsync(Guid matchId, CancellationToken cancellationToken = default);
        Task<TacticalLayoutViewModel?> SaveTacticalLayoutAsync(SaveTacticalLayoutViewModel model, CancellationToken cancellationToken = default);

        Task<ImportPlayersCsvResultViewModel?> ImportPlayersCsvAsync(Guid teamId, IFormFile file, CancellationToken cancellationToken = default);

        Task<AlertsResponseViewModel> GetAlertsAsync(CancellationToken cancellationToken = default);
        Task<bool> MarkAlertReadAsync(Guid alertId, CancellationToken cancellationToken = default);
    }
}
