using System.ComponentModel.DataAnnotations;
using Diskie.DataAccess.Model.Models.Enums;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class CreateUserViewModel
    {
        public Guid? TenantId { get; set; }

        [Required]
        public UserRole Role { get; set; }

        [EmailAddress]
        [StringLength(200)]
        public string? Email { get; set; }

        [Phone]
        [StringLength(30)]
        public string? Phone { get; set; }

        [Required]
        [StringLength(100, MinimumLength = 6)]
        public string Password { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string LastName { get; set; } = string.Empty;

        [Url]
        [StringLength(500)]
        public string? ProfilePhotoUrl { get; set; }

        // Player
        public DateTime? DateOfBirth { get; set; }
        public string? Gender { get; set; }
        public string? EmergencyContactName { get; set; }
        public string? EmergencyContactPhone { get; set; }
        public string? EmergencyContactRelationship { get; set; }
        public int? JerseyNumber { get; set; }
        public string? PreferredPosition { get; set; }
        public bool IsBoarding { get; set; }

        // Guardian
        public string? Relationship { get; set; }
        public bool IsPrimaryGuardian { get; set; }
        public bool CanConsent { get; set; } = true;
        public bool ReceivesUpdates { get; set; } = true;

        // Coach
        public string? Qualification { get; set; }
        public int? ExperienceYears { get; set; }
        public List<string>? SportSpecializations { get; set; }
        public string? CoachingLicense { get; set; }
    }
}
