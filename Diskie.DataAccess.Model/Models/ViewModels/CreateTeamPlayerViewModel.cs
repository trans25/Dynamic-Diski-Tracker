using System.ComponentModel.DataAnnotations;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class CreateTeamPlayerViewModel
    {
        [Required]
        public Guid TeamId { get; set; }

        [Required]
        public Guid PlayerId { get; set; }

        [StringLength(50)]
        public string? Role { get; set; }

        public int? JerseyNumber { get; set; }

        [StringLength(50)]
        public string? Position { get; set; }
    }
}
