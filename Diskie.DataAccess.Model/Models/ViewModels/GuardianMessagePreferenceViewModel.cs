using Diskie.DataAccess.Model.Models.Enums;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class GuardianMessagePreferenceViewModel
    {
        public Guid Id { get; set; }
        public Guid GuardianId { get; set; }
        public MessageChannel Channel { get; set; }
        public string? Category { get; set; }
        public bool IsEnabled { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
