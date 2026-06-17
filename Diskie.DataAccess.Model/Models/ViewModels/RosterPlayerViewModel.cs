namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class RosterPlayerViewModel
    {
        public Guid PlayerId { get; set; }
        public Guid TeamId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? ProfilePhotoUrl { get; set; }
        public int? JerseyNumber { get; set; }
        public string? Position { get; set; }
        public string? TeamRole { get; set; }
        public bool IsActive { get; set; }
        public bool HasActiveInjury { get; set; }
    }
}
