using Diskie.DataAccess.Model.DbModels;
using System;
using System.Collections.Generic;
using System.Text;

namespace Diskie.DataAccess.Model.Models.DbModels
{
    public class TeamPlayer
    {
        public Guid TeamId { get; set; }
        public Guid PlayerId { get; set; }

        public string? Role { get; set; }
        public int? JerseyNumber { get; set; }
        public string? Position { get; set; }
        public bool IsActive { get; set; } = true;

        public Team Team { get; set; } = null!;
        public User Player { get; set; } = null!;
    }
}
