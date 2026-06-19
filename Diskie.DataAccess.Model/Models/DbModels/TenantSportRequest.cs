using Diskie.DataAccess.Model.Models.Enums;

namespace Diskie.DataAccess.Model.Models.DbModels
{
    public class TenantSportRequest : SharedModel
    {
        public Guid TenantId { get; set; }
        public Guid RequestedSportTemplateId { get; set; }
        public SportRequestStatus Status { get; set; } = SportRequestStatus.Pending;
        public DateTime RequestedDate { get; set; }

        public Tenant Tenant { get; set; } = null!;
        public SportTemplate RequestedSportTemplate { get; set; } = null!;
    }
}