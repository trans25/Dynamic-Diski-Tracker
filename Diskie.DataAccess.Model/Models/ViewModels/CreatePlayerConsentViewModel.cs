using System.ComponentModel.DataAnnotations;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class CreatePlayerConsentViewModel
    {
        [Required]
        public Guid PlayerId { get; set; }

        [Required]
        public Guid ConsentFormId { get; set; }

        public string? SignatureData { get; set; }

        [StringLength(50)]
        public string? SignatureIp { get; set; }
    }
}
