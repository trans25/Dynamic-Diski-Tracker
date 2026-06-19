using System.ComponentModel.DataAnnotations;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class UpdateRosterPlayerViewModel
    {
        [Required]
        [StringLength(200)]
        public string FullName { get; set; } = string.Empty;

        [StringLength(100)]
        public string? Position { get; set; }

        public int? JerseyNumber { get; set; }

        public string? TeamRole { get; set; }

        public bool IsActive { get; set; } = true;
    }
}
