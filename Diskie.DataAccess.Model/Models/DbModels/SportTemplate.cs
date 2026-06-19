using System;
using System.Collections.Generic;
using System.Text;
using Diskie.DataAccess.Model.Models.Enums;

namespace Diskie.DataAccess.Model.Models.DbModels
{
    public class SportTemplate : SharedModel
    {
        public string Name { get; set; } = null!;         
        public string DisplayName { get; set; } = null!;   
        public SportType SportType { get; set; } = SportType.Football;
        public string? Icon { get; set; }
        public string? Description { get; set; }
        public string MetricDefinitions { get; set; } = "[]";
        public string PositionDefinitions { get; set; } = "[]";

        // JSON fields
        public List<AssessmentMetric> AssessmentMetrics { get; set; } = new();
        public List<MatchStatField> MatchStatsFields { get; set; } = new();
        public List<string>? PositionOptions { get; set; }
        public int? DefaultSeasonWeeks { get; set; }

        public bool IsActive { get; set; } = true;

        // Navigation
        public ICollection<Season> Seasons { get; set; } = new List<Season>();
        public ICollection<Team> Teams { get; set; } = new List<Team>();
        public ICollection<Assessment> Assessments { get; set; } = new List<Assessment>();
        public ICollection<Tenant> AssignedTenants { get; set; } = new List<Tenant>();
        public ICollection<TenantSportRequest> TenantSportRequests { get; set; } = new List<TenantSportRequest>();
    }
}
