using Diskie.DataAccess.Model.DbModels;
using Diskie.DataAccess.Model.Models.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Diskie.DataAccess.Model.Models.DbModels
{
    public class GuardianMessagePreference : SharedModel
    {
        public Guid GuardianId { get; set; }

        public MessageChannel Channel { get; set; }
        public string? Category { get; set; } 
        public bool IsEnabled { get; set; } = true;

        // Navigation
        public User Guardian { get; set; } = null!;
    }
}
