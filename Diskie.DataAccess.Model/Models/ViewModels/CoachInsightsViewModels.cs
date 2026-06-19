namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class PlayerGrowthPointViewModel
    {
        public DateOnly MatchDate { get; set; }
        public double Rating { get; set; }
        public int Goals { get; set; }
        public int Assists { get; set; }
    }

    public class PositionalDepthItemViewModel
    {
        public string Position { get; set; } = "Unknown";
        public double AverageRating { get; set; }
        public double SquadAverage { get; set; }
        public bool IsBelowSquadAverage { get; set; }
    }

    public class TrainingMatchCorrelationPointViewModel
    {
        public Guid PlayerId { get; set; }
        public string PlayerName { get; set; } = string.Empty;
        public int TrainingCount { get; set; }
        public double MatchRating { get; set; }
    }

    public class ChemistryPairViewModel
    {
        public Guid PlayerAId { get; set; }
        public string PlayerAName { get; set; } = string.Empty;
        public Guid PlayerBId { get; set; }
        public string PlayerBName { get; set; } = string.Empty;
        public int MatchesTogether { get; set; }
        public double GoalsPerGame { get; set; }
        public double WinPercentage { get; set; }
        public double CombinedGoalContributionsPerGame { get; set; }
    }

    public class SquadFatigueItemViewModel
    {
        public Guid PlayerId { get; set; }
        public string PlayerName { get; set; } = string.Empty;
        public int MinutesPlayedLast7Days { get; set; }
        public string Status { get; set; } = "Fit";
    }
}
