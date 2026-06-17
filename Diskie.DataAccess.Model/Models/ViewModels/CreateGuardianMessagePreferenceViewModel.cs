using System.ComponentModel.DataAnnotations;
using Diskie.DataAccess.Model.Models.Enums;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class CreateGuardianMessagePreferenceViewModel
    {
        [Required]
        public Guid GuardianId { get; set; }

        [Required]
        public MessageChannel Channel { get; set; }

        [StringLength(100)]
        public string? Category { get; set; }

        public bool IsEnabled { get; set; } = true;
    }
}
