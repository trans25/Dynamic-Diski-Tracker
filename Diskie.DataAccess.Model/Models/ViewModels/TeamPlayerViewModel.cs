namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class TeamPlayerViewModel
    {
        public Guid TeamId { get; set; }
        public Guid PlayerId { get; set; }
        public string? Role { get; set; }
        public int? JerseyNumber { get; set; }
        public string? Position { get; set; }
        public bool IsActive { get; set; }
    }
}
