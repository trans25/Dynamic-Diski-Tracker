using System;
using System.Collections.Generic;
using System.Text;

namespace Diskie.DataAccess.Model.Models.DbModels
{
    public  class Season : SharedModel
    {
        public Guid TenantId { get; set; }
        public Guid SportTemplateId { get; set; }
        public string Name { get; set; } = null!;
        public DateOnly StartDate { get; set; }
        public DateOnly EndDate { get; set; }
        public string? Term { get; set; }
        public int? AcademicYear { get; set; }
        public bool IsActive { get; set; } = true;

        // Navigation
        public Tenant Tenant { get; set; } = null!;
        public SportTemplate SportTemplate { get; set; } = null!;
        public ICollection<Team> Teams { get; set; } = new List<Team>();
        public ICollection<Fixture> Fixtures { get; set; } = new List<Fixture>();
        public ICollection<ConsentForm> ConsentForms { get; set; } = new List<ConsentForm>();
    }
}
