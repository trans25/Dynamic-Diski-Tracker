using Diskie.DataAccess.Model.Models.Enums;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class TenantBillingViewModel
    {
        public Guid TenantId { get; set; }
        public string TenantName { get; set; } = string.Empty;
        public BillingPlan BillingPlan { get; set; }
        public DateTime? BillingPlanAssignedAt { get; set; }
    }
}
