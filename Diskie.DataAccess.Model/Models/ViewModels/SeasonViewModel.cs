namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class SeasonViewModel
    {
        public Guid Id { get; set; }
        public Guid TenantId { get; set; }
        public Guid SportTemplateId { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateOnly StartDate { get; set; }
        public DateOnly EndDate { get; set; }
        public string? Term { get; set; }
        public int? AcademicYear { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
