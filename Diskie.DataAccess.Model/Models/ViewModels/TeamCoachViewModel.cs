namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class TeamCoachViewModel
    {
        public Guid TeamId { get; set; }
        public Guid CoachId { get; set; }
        public string? Role { get; set; }
        public bool IsPrimary { get; set; }
    }
}
