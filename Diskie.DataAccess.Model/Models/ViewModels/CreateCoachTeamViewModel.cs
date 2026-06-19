using System.ComponentModel.DataAnnotations;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    /// <summary>
    /// Payload a coach submits to create a new team for themselves based on an
    /// available sport template. When <see cref="SeasonId"/> is omitted, an active
    /// season for the coach's tenant and the chosen template is reused or created.
    /// </summary>
    public class CreateCoachTeamViewModel
    {
        [Required]
        public Guid SportTemplateId { get; set; }

        [Required]
        [StringLength(150)]
        public string Name { get; set; } = string.Empty;

        [StringLength(50)]
        public string? AgeGroup { get; set; }

        [StringLength(50)]
        public string? GenderCategory { get; set; }

        [StringLength(50)]
        public string? Level { get; set; }

        public Guid? SeasonId { get; set; }
    }
}
