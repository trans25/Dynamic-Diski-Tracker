using System.ComponentModel.DataAnnotations;
using Diskie.DataAccess.Model.Models.Enums;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class UpdatePlayerConsentViewModel
    {
        [Required]
        public Guid PlayerId { get; set; }

        [Required]
        public Guid ConsentFormId { get; set; }

        [Required]
        public ConsentStatus Status { get; set; }

        public string? SignatureData { get; set; }

        [StringLength(50)]
        public string? SignatureIp { get; set; }

        [StringLength(500)]
        public string? WithdrawalReason { get; set; }
    }
}
