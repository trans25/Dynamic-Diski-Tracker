using Diskie.DataAccess.Model.Models.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Diskie.DataAccess.Model.Models.DbModels
{
    public class Fixture : SharedModel
    {
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

        public Team Team { get; set; } = null!;
        public Season Season { get; set; } = null!;

        public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
        public ICollection<Availability> Availabilities { get; set; } = new List<Availability>();
        public ICollection<Injury> Injuries { get; set; } = new List<Injury>();
        public ICollection<Assessment> Assessments { get; set; } = new List<Assessment>();
    }
}
