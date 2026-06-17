using Diskie.DataAccess.Model.DbModels;
using Diskie.DataAccess.Model.Models.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Diskie.DataAccess.Model.Models.DbModels
{
    public class Tenant : SharedModel
    {
        public string Name { get; set; } = null!;
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? Province { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? LogoUrl { get; set; }
        public bool IsActive { get; set; } = true;

        // Billing
        public BillingPlan BillingPlan { get; set; } = BillingPlan.Free;
        public DateTime? BillingPlanAssignedAt { get; set; }

        // Navigation
        public ICollection<User> Users { get; set; } = new List<User>();
        public ICollection<Season> Seasons { get; set; } = new List<Season>();
        public ICollection<Team> Teams { get; set; } = new List<Team>();
        public ICollection<ConsentForm> ConsentForms { get; set; } = new List<ConsentForm>();
    }
}
