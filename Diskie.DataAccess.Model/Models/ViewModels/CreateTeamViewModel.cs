using System.ComponentModel.DataAnnotations;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class CreateTeamViewModel
    {
        [Required]
        public Guid TenantId { get; set; }

        [Required]
        public Guid SeasonId { get; set; }

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

        public Guid? CaptainId { get; set; }
        public Guid? ViceCaptainId { get; set; }
    }
}
