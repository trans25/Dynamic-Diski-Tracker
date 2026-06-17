using Diskie.DataAccess.Model.DbModels;
using Diskie.DataAccess.Model.Models.Enums;

namespace Diskie.DataAccess.Model.Models.DbModels
{
    public class Announcement : SharedModel
    {
        public Guid TenantId { get; set; }
        public Guid? TeamId { get; set; }
        public Guid SenderId { get; set; }

        public string Title { get; set; } = null!;
        public string Body { get; set; } = null!;
        public AnnouncementAudience Audience { get; set; } = AnnouncementAudience.Team;
        public AnnouncementPriority Priority { get; set; } = AnnouncementPriority.Normal;
        public MessageChannel Channel { get; set; } = MessageChannel.Push;
        public DateTime? SentAt { get; set; }

        // Navigation
        public Tenant Tenant { get; set; } = null!;
        public Team? Team { get; set; }
        public User Sender { get; set; } = null!;
    }
}
