using System;
using System.Collections.Generic;
using System.Text;

namespace Diskie.DataAccess.Model.Models.DbModels
{
    public class ConsentForm : SharedModel
    {
        public Guid TenantId { get; set; }
        public Guid? SeasonId { get; set; }

        public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public string? FormContent { get; set; } // HTML / text
        public string? Purpose { get; set; }
        public bool IsMandatory { get; set; }
        public bool RequiresSignature { get; set; }
        public string? SignatureType { get; set; } = "typed";
        public DateOnly? ExpiresAt { get; set; }
        public bool IsActive { get; set; } = true;

        public Tenant Tenant { get; set; } = null!;
        public Season? Season { get; set; }
        public ICollection<PlayerConsent> PlayerConsents { get; set; } = new List<PlayerConsent>();
    }

}
