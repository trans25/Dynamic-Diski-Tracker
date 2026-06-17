using Diskie.DataAccess.Model.DbModels;
using Diskie.DataAccess.Model.Models.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Diskie.DataAccess.Model.Models.DbModels
{
    public class Attendance : SharedModel
    {
        public Guid TeamId { get; set; }
        public Guid PlayerId { get; set; }
        public Guid? FixtureId { get; set; }

        public string SessionType { get; set; } = "training"; 
        public DateOnly SessionDate { get; set; }
        public AttendanceStatus Status { get; set; }
        public string? Notes { get; set; }
        public Guid? RecordedBy { get; set; }

        public bool Synced { get; set; } = false;
        public DateTime? SyncedAt { get; set; }

        public Team Team { get; set; } = null!;
        public User Player { get; set; } = null!;
        public Fixture? Fixture { get; set; }
        public User? Recorder { get; set; }
    }
}
