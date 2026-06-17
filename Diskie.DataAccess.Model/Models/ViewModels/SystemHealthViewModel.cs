namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class HealthCheckItemViewModel
    {
        public string Component { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class SystemHealthViewModel
    {
        public string Status { get; set; } = "Healthy";
        public DateTime CheckedAt { get; set; } = DateTime.UtcNow;
        public long UptimeSeconds { get; set; }
        public List<HealthCheckItemViewModel> Checks { get; set; } = new();
    }
}
