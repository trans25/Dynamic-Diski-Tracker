using System.ComponentModel.DataAnnotations;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class CreateConsentFormViewModel
    {
        [Required]
        public Guid TenantId { get; set; }

        public Guid? SeasonId { get; set; }

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [StringLength(1000)]
        public string? Description { get; set; }

        public string? FormContent { get; set; }

        [StringLength(500)]
        public string? Purpose { get; set; }

        public bool IsMandatory { get; set; }
        public bool RequiresSignature { get; set; }

        [StringLength(50)]
        public string? SignatureType { get; set; } = "typed";

        public DateOnly? ExpiresAt { get; set; }
    }
}
