using Diskie.DataAccess.Model.Models.ViewModels;

namespace Diskie.API.Services.Coach
{
    public enum CoachTeamMutationStatus
    {
        Success,
        NotFound,
        DuplicateName
    }

    public sealed class CoachTeamMutationResult
    {
        public CoachTeamMutationStatus Status { get; init; }

        public CoachTeamViewModel? Team { get; init; }

        public static CoachTeamMutationResult Succeeded(CoachTeamViewModel team) =>
            new() { Status = CoachTeamMutationStatus.Success, Team = team };

        public static CoachTeamMutationResult NotFound() =>
            new() { Status = CoachTeamMutationStatus.NotFound };

        public static CoachTeamMutationResult DuplicateName() =>
            new() { Status = CoachTeamMutationStatus.DuplicateName };
    }
}
