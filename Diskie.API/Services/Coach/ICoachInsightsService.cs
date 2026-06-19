using Diskie.DataAccess.Model.Models.ViewModels;

namespace Diskie.API.Services.Coach
{
    public interface ICoachInsightsService
    {
        Task<IReadOnlyList<PlayerGrowthPointViewModel>> GetPlayerGrowthAsync(Guid playerId, string? season = null, CancellationToken cancellationToken = default);

        Task<PlayerSkillsViewModel?> GetPlayerSkillsAsync(Guid playerId, CancellationToken cancellationToken = default);

        Task<IReadOnlyList<PlayerAchievementViewModel>> GetPlayerAchievementsAsync(Guid playerId, CancellationToken cancellationToken = default);

        Task<IReadOnlyList<SquadAttendanceSummaryViewModel>> GetSquadAttendanceAsync(Guid? teamId, DateOnly? sessionDate, CancellationToken cancellationToken = default);

        Task<SquadAttendanceSummaryViewModel?> MarkTrainingAttendanceAsync(MarkTrainingAttendanceViewModel model, CancellationToken cancellationToken = default);

        Task<IReadOnlyList<SquadFatigueItemViewModel>> GetSquadFatigueAsync(CancellationToken cancellationToken = default);

        Task<IReadOnlyList<PositionalDepthItemViewModel>> GetPositionalDepthAsync(CancellationToken cancellationToken = default);

        Task<IReadOnlyList<TrainingMatchCorrelationPointViewModel>> GetTrainingCorrelationAsync(CancellationToken cancellationToken = default);

        Task<IReadOnlyList<ChemistryPairViewModel>> GetTopChemistryPairsAsync(int top = 5, CancellationToken cancellationToken = default);
    }
}
