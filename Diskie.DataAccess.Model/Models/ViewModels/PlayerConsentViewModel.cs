using Diskie.DataAccess.Model.Models.Enums;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class PlayerConsentViewModel
    {
        public Guid PlayerId { get; set; }
        public Guid ConsentFormId { get; set; }
        public ConsentStatus Status { get; set; }
        public DateTime? SignedAt { get; set; }
        public string? SignatureData { get; set; }
        public string? SignatureIp { get; set; }
        public DateTime? WithdrawnAt { get; set; }
        public string? WithdrawalReason { get; set; }
    }
}
