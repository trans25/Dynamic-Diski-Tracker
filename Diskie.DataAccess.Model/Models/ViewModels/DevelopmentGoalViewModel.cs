using Diskie.DataAccess.Model.Models.Enums;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class DevelopmentGoalViewModel
    {
        public Guid Id { get; set; }
        public Guid PlayerId { get; set; }
        public Guid CoachId { get; set; }
        public Guid? TeamId { get; set; }
        public Guid? SportTemplateId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateOnly? TargetDate { get; set; }
        public DevelopmentGoalStatus Status { get; set; }
        public int? Progress { get; set; }
        public DateOnly? AchievedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
