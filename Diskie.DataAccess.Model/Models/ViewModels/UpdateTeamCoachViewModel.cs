using System.ComponentModel.DataAnnotations;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class UpdateTeamCoachViewModel
    {
        [Required]
        public Guid TeamId { get; set; }

        [Required]
        public Guid CoachId { get; set; }

        [StringLength(50)]
        public string? Role { get; set; }

        public bool IsPrimary { get; set; }
    }
}
