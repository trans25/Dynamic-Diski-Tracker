using Diskie.DataAccess.Model.DbModels;
using System;
using System.Collections.Generic;
using System.Text;

namespace Diskie.DataAccess.Model.Models.DbModels
{
    public class TeamCoach
    {
        public Guid TeamId { get; set; }
        public Guid CoachId { get; set; }

        public string? Role { get; set; }
        public bool IsPrimary { get; set; }

        public Team Team { get; set; } = null!;
        public User Coach { get; set; } = null!;
    }
}
