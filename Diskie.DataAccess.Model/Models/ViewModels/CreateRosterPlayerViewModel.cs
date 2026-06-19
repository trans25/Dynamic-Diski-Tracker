using System.ComponentModel.DataAnnotations;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class CreateRosterPlayerViewModel
    {
        [Required]
        [StringLength(200)]
        public string FullName { get; set; } = string.Empty;

        [StringLength(100)]
        public string? Position { get; set; }

        public int? JerseyNumber { get; set; }

        public DateOnly? DateOfBirth { get; set; }

        // Optional guardian details. When an email is supplied a guardian account
        // is provisioned if it does not already exist and linked to the player.
        [StringLength(200)]
        public string? GuardianName { get; set; }

        [EmailAddress]
        [StringLength(256)]
        public string? GuardianEmail { get; set; }

        [Phone]
        [StringLength(50)]
        public string? GuardianPhone { get; set; }
    }
}
