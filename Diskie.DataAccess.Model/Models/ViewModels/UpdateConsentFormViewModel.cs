using System.ComponentModel.DataAnnotations;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class UpdateConsentFormViewModel
    {
        [Required]
        public Guid Id { get; set; }

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
        public string? SignatureType { get; set; }

        public DateOnly? ExpiresAt { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
