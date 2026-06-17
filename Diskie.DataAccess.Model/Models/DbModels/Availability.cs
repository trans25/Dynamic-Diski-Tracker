using Diskie.DataAccess.Model.DbModels;
using Diskie.DataAccess.Model.Models.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Diskie.DataAccess.Model.Models.DbModels
{
    public class Availability : SharedModel
    {
        public Guid PlayerId { get; set; }
        public Guid FixtureId { get; set; }
        public Guid TeamId { get; set; }

        public AvailabilityStatus Status { get; set; } = AvailabilityStatus.NoResponse;
        public string? ResponseSource { get; set; } // "whatsapp", "app"
        public DateTime? ResponseTimestamp { get; set; }
        public string? Notes { get; set; }

        public User Player { get; set; } = null!;
        public Fixture Fixture { get; set; } = null!;
        public Team Team { get; set; } = null!;
    }
}
