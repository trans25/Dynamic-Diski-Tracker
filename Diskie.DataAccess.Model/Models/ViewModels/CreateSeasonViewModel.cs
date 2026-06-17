using System.ComponentModel.DataAnnotations;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class CreateSeasonViewModel
    {
        [Required]
        public Guid TenantId { get; set; }

        [Required]
        public Guid SportTemplateId { get; set; }

        [Required]
        [StringLength(150)]
        public string Name { get; set; } = string.Empty;

        [Required]
        public DateOnly StartDate { get; set; }

        [Required]
        public DateOnly EndDate { get; set; }

        [StringLength(50)]
        public string? Term { get; set; }

        public int? AcademicYear { get; set; }
    }
}
