using Diskie.DataAccess.Model.DbModels;
using Diskie.DataAccess.Model.Models.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Diskie.DataAccess.Model.Models.DbModels
{
    public class DevelopmentGoal : SharedModel
    {
        public Guid PlayerId { get; set; }
        public Guid CoachId { get; set; }
        public Guid? TeamId { get; set; }
        public Guid? SportTemplateId { get; set; }

        public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public DateOnly? TargetDate { get; set; }
        public DevelopmentGoalStatus Status { get; set; } = DevelopmentGoalStatus.NotStarted;
        public int? Progress { get; set; } 
        public DateOnly? AchievedAt { get; set; }

        // Navigation
        public User Player { get; set; } = null!;
        public User Coach { get; set; } = null!;
        public Team? Team { get; set; }
        public SportTemplate? SportTemplate { get; set; }
    }
}
