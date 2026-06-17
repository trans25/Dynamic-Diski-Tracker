namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class SuperAdminDashboardViewModel
    {
        public int TotalTenants { get; set; }
        public int ActiveTenants { get; set; }
        public int SuspendedTenants { get; set; }
        public int TotalUsers { get; set; }
        public int ActiveUsers { get; set; }
        public int TotalSportTemplates { get; set; }
        public Dictionary<string, int> TenantsByBillingPlan { get; set; } = new();
        public Dictionary<string, int> UsersByRole { get; set; } = new();
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    }
}
