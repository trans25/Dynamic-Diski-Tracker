using Diskie.DataAccess.Model.DbModels;
using System;
using System.Collections.Generic;
using System.Text;

namespace Diskie.DataAccess.Model.Models.DbModels
{
    public class PlayerGuardian
    {
        public Guid PlayerId { get; set; }
        public Guid GuardianId { get; set; }

        public bool IsPrimary { get; set; }
        public int ConsentPriority { get; set; } = 1;

        public User Player { get; set; } = null!;
        public User Guardian { get; set; } = null!;
    }
}
