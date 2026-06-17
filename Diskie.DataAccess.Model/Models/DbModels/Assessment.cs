using Diskie.DataAccess.Model.DbModels;
using System;
using System.Collections.Generic;
using System.Text;

namespace Diskie.DataAccess.Model.Models.DbModels
{
    public class Assessment : SharedModel
    {
        public Guid PlayerId { get; set; }
        public Guid CoachId { get; set; }
        public Guid TeamId { get; set; }
        public Guid SportTemplateId { get; set; }

        public DateOnly AssessmentDate { get; set; }
        public Dictionary<string, object> Metrics { get; set; } = new();
        public string? FreeText { get; set; }
        public int? OverallRating { get; set; } // 1-5
        public bool IsMatchAssessment { get; set; }
        public Guid? FixtureId { get; set; }

        public User Player { get; set; } = null!;
        public User Coach { get; set; } = null!;
        public Team Team { get; set; } = null!;
        public SportTemplate SportTemplate { get; set; } = null!;
        public Fixture? Fixture { get; set; }
    }
}
