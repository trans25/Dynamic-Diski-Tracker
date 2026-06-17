using System.ComponentModel.DataAnnotations;
using Diskie.DataAccess.Model.Models.Enums;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class UpdateFixtureViewModel
    {
        [Required]
        public Guid Id { get; set; }

        [Required]
        public Guid TeamId { get; set; }

        [Required]
        public Guid SeasonId { get; set; }

        [Required]
        public DateOnly FixtureDate { get; set; }

        [Required]
        public TimeOnly StartTime { get; set; }

        public TimeOnly? EndTime { get; set; }

        [StringLength(200)]
        public string? Venue { get; set; }

        [StringLength(200)]
        public string? Opponent { get; set; }

        [Required]
        public FixtureType Type { get; set; }

        public FixtureResult? Result { get; set; }
        public int? HomeScore { get; set; }
        public int? AwayScore { get; set; }

        [StringLength(4000)]
        public string? MatchReport { get; set; }

        public bool IsTraining { get; set; }
        public bool IsCancelled { get; set; }
    }
}
