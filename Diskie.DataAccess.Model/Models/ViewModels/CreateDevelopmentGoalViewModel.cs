using System.ComponentModel.DataAnnotations;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class CreateDevelopmentGoalViewModel
    {
        [Required]
        public Guid PlayerId { get; set; }

        [Required]
        public Guid CoachId { get; set; }

        public Guid? TeamId { get; set; }
        public Guid? SportTemplateId { get; set; }

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [StringLength(2000)]
        public string? Description { get; set; }

        public DateOnly? TargetDate { get; set; }
    }
}
