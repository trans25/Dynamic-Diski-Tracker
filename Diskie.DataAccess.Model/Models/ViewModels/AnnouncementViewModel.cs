using Diskie.DataAccess.Model.Models.Enums;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class AnnouncementViewModel
    {
        public Guid Id { get; set; }
        public Guid TenantId { get; set; }
        public Guid? TeamId { get; set; }
        public Guid SenderId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public AnnouncementAudience Audience { get; set; }
        public AnnouncementPriority Priority { get; set; }
        public MessageChannel Channel { get; set; }
        public DateTime? SentAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
