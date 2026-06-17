using System.ComponentModel.DataAnnotations;
using Diskie.DataAccess.Model.Models.Enums;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class AssignBillingPlanViewModel
    {
        [Required]
        public Guid TenantId { get; set; }

        [Required]
        [EnumDataType(typeof(BillingPlan))]
        public BillingPlan BillingPlan { get; set; }
    }
}
