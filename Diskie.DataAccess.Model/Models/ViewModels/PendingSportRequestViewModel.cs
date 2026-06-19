using Diskie.DataAccess.Model.Models.Enums;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class PendingSportRequestViewModel
    {
        public Guid Id { get; set; }
        public Guid TenantId { get; set; }
        public string TenantName { get; set; } = string.Empty;
        public string? TenantEmail { get; set; }
        public string? City { get; set; }
        public string? Province { get; set; }
        public Guid RequestedSportTemplateId { get; set; }
        public string RequestedSportTemplateName { get; set; } = string.Empty;
        public SportType SportType { get; set; }
        public SportRequestStatus Status { get; set; }
        public DateTime RequestedDate { get; set; }
    }
}