using System.ComponentModel.DataAnnotations;
using Diskie.DataAccess.Model.Models.Enums;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class UpdateAnnouncementViewModel
    {
        [Required]
        public Guid Id { get; set; }

        public Guid? TeamId { get; set; }

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [StringLength(4000)]
        public string Body { get; set; } = string.Empty;

        [Required]
        public AnnouncementAudience Audience { get; set; } = AnnouncementAudience.Team;

        [Required]
        public AnnouncementPriority Priority { get; set; } = AnnouncementPriority.Normal;

        [Required]
        public MessageChannel Channel { get; set; } = MessageChannel.Push;
    }
}
