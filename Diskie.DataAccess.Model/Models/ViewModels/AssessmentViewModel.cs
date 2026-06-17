namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class AssessmentViewModel
    {
        public Guid Id { get; set; }
        public Guid PlayerId { get; set; }
        public Guid CoachId { get; set; }
        public Guid TeamId { get; set; }
        public Guid SportTemplateId { get; set; }
        public DateOnly AssessmentDate { get; set; }
        public Dictionary<string, object> Metrics { get; set; } = new();
        public string? FreeText { get; set; }
        public int? OverallRating { get; set; }
        public bool IsMatchAssessment { get; set; }
        public Guid? FixtureId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
