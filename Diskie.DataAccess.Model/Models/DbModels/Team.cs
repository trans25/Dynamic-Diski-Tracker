using Diskie.DataAccess.Model.DbModels;
using System;
using System.Collections.Generic;
using System.Text;

namespace Diskie.DataAccess.Model.Models.DbModels
{
    public  class Team : SharedModel
    {
        public Guid TenantId { get; set; }
        public Guid SeasonId { get; set; }
        public Guid SportTemplateId { get; set; }

        public string Name { get; set; } = null!;
        public string? AgeGroup { get; set; }
        public string? GenderCategory { get; set; }
        public string? Level { get; set; }

        public Guid? CaptainId { get; set; }
        public Guid? ViceCaptainId { get; set; }

        public bool IsActive { get; set; } = true;

        // Navigation
        public Tenant Tenant { get; set; } = null!;
        public Season Season { get; set; } = null!;
        public SportTemplate SportTemplate { get; set; } = null!;
        public User? Captain { get; set; }
        public User? ViceCaptain { get; set; }

        public ICollection<TeamPlayer> TeamPlayers { get; set; } = new List<TeamPlayer>();
        public ICollection<TeamCoach> TeamCoaches { get; set; } = new List<TeamCoach>();
        public ICollection<Fixture> Fixtures { get; set; } = new List<Fixture>();
        public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
        public ICollection<Availability> Availabilities { get; set; } = new List<Availability>();
        public ICollection<Assessment> Assessments { get; set; } = new List<Assessment>();
    }
}
