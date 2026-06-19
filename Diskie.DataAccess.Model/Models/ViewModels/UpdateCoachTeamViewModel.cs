using System.ComponentModel.DataAnnotations;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    /// <summary>
    /// Payload a coach submits to update one of their existing teams. Only the
    /// editable descriptive fields are exposed; the sport template and season
    /// remain fixed for the lifetime of the team.
    /// </summary>
    public class UpdateCoachTeamViewModel
    {
        [Required]
        public Guid Id { get; set; }

        [Required]
        [StringLength(150)]
        public string Name { get; set; } = string.Empty;

        [StringLength(50)]
        public string? AgeGroup { get; set; }

        [StringLength(50)]
        public string? GenderCategory { get; set; }

        [StringLength(50)]
        public string? Level { get; set; }

        public bool IsActive { get; set; } = true;
    }
}
