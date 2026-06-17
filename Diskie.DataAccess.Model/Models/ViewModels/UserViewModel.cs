using Diskie.DataAccess.Model.Models.Enums;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class UserViewModel
    {
        public Guid Id { get; set; }
        public Guid? TenantId { get; set; }
        public UserRole Role { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? ProfilePhotoUrl { get; set; }
        public bool IsActive { get; set; }
        public DateTime? LastLoginAt { get; set; }

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
        public bool CanConsent { get; set; }
        public bool ReceivesUpdates { get; set; }

        // Coach
        public string? Qualification { get; set; }
        public int? ExperienceYears { get; set; }
        public List<string>? SportSpecializations { get; set; }
        public string? CoachingLicense { get; set; }
    }
}
