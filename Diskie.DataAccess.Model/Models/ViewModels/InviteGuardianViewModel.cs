using System.ComponentModel.DataAnnotations;
using Diskie.DataAccess.Model.Models.Enums;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class InviteGuardianViewModel
    {
        [Required]
        public Guid PlayerId { get; set; }

        [Required]
        [StringLength(200)]
        public string GuardianName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [StringLength(256)]
        public string GuardianEmail { get; set; } = string.Empty;

        [Phone]
        [StringLength(50)]
        public string? GuardianPhone { get; set; }

        [StringLength(100)]
        public string? Relationship { get; set; }

        public bool IsPrimary { get; set; }
    }

    public class GuardianInviteResultViewModel
    {
        public Guid GuardianId { get; set; }
        public Guid PlayerId { get; set; }
        public string GuardianName { get; set; } = string.Empty;
        public string GuardianEmail { get; set; } = string.Empty;
        public string? Relationship { get; set; }
        public bool IsPrimary { get; set; }
        public bool AccountCreated { get; set; }
    }
}
