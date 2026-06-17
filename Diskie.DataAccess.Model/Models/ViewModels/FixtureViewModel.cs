using Diskie.DataAccess.Model.Models.Enums;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class FixtureViewModel
    {
        public Guid Id { get; set; }
        public Guid TeamId { get; set; }
        public Guid SeasonId { get; set; }
        public DateOnly FixtureDate { get; set; }
        public TimeOnly StartTime { get; set; }
        public TimeOnly? EndTime { get; set; }
        public string? Venue { get; set; }
        public string? Opponent { get; set; }
        public FixtureType Type { get; set; }
        public FixtureResult? Result { get; set; }
        public int? HomeScore { get; set; }
        public int? AwayScore { get; set; }
        public string? MatchReport { get; set; }
        public bool IsTraining { get; set; }
        public bool IsCancelled { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
