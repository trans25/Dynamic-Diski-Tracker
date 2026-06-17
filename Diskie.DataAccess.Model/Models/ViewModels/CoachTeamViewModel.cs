namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class CoachTeamViewModel
    {
        public Guid Id { get; set; }
        public Guid TenantId { get; set; }
        public Guid SeasonId { get; set; }
        public Guid SportTemplateId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? AgeGroup { get; set; }
        public string? GenderCategory { get; set; }
        public string? Level { get; set; }
        public string? CoachRole { get; set; }
        public bool IsPrimaryCoach { get; set; }
        public int PlayerCount { get; set; }
        public bool IsActive { get; set; }
    }
}
