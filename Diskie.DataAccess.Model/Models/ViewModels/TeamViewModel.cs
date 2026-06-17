namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class TeamViewModel
    {
        public Guid Id { get; set; }
        public Guid TenantId { get; set; }
        public Guid SeasonId { get; set; }
        public Guid SportTemplateId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? AgeGroup { get; set; }
        public string? GenderCategory { get; set; }
        public string? Level { get; set; }
        public Guid? CaptainId { get; set; }
        public Guid? ViceCaptainId { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
