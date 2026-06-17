using System.ComponentModel.DataAnnotations;
using Diskie.DataAccess.Model.Models.Enums;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class UpdateDevelopmentGoalViewModel
    {
        [Required]
        public Guid Id { get; set; }

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [StringLength(2000)]
        public string? Description { get; set; }

        public DateOnly? TargetDate { get; set; }

        [Required]
        public DevelopmentGoalStatus Status { get; set; }

        [Range(0, 100)]
        public int? Progress { get; set; }

        public DateOnly? AchievedAt { get; set; }
    }
}
