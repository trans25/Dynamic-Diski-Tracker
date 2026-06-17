using Diskie.DataAccess.Model.DbModels;
using Diskie.DataAccess.Model.Models.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Diskie.DataAccess.Model.Models.DbModels
{
    public class PlayerConsent
    {
        public Guid PlayerId { get; set; }
        public Guid ConsentFormId { get; set; }

        public ConsentStatus Status { get; set; } = ConsentStatus.Pending;
        public DateTime? SignedAt { get; set; }
        public string? SignatureData { get; set; }
        public string? SignatureIp { get; set; }
        public DateTime? WithdrawnAt { get; set; }
        public string? WithdrawalReason { get; set; }

        public User Player { get; set; } = null!;
        public ConsentForm ConsentForm { get; set; } = null!;
    }

}
