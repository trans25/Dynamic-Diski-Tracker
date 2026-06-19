using System.ComponentModel.DataAnnotations;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class UpdateTenantViewModel
    {
        [Required]
        public Guid Id { get; set; }

        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;

        [StringLength(300)]
        public string? Address { get; set; }

        [StringLength(100)]
        public string? City { get; set; }

        [StringLength(100)]
        public string? Province { get; set; }

        [Phone]
        [StringLength(30)]
        public string? Phone { get; set; }

        [EmailAddress]
        [StringLength(200)]
        public string? Email { get; set; }

        [Url]
        [StringLength(500)]
        public string? LogoUrl { get; set; }

        public Guid? AssignedSportTemplateId { get; set; }

        public bool IsActive { get; set; } = true;
        public bool IsApproved { get; set; }
    }
}
