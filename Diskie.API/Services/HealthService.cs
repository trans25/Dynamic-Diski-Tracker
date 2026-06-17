using System.Diagnostics;
using Diskie.DataAccess.Contracts;
using Diskie.DataAccess.Model.Models.ViewModels;
using Microsoft.EntityFrameworkCore;

namespace Diskie.API.Services
{
    public class HealthService : IHealthService
    {
        private readonly DiskiDbContext _context;

        public HealthService(DiskiDbContext context)
        {
            _context = context;
        }

        public async Task<SystemHealthViewModel> GetSummaryAsync(CancellationToken cancellationToken = default)
        {
            var checks = new List<HealthCheckItemViewModel>();

            bool canConnect;
            try
            {
                canConnect = await _context.Database.CanConnectAsync(cancellationToken);
            }
            catch
            {
                canConnect = false;
            }

            checks.Add(new HealthCheckItemViewModel
            {
                Component = "Database",
                Status = canConnect ? "Healthy" : "Unhealthy",
                Description = canConnect ? "Database reachable" : "Database connection failed"
            });

            checks.Add(new HealthCheckItemViewModel
            {
                Component = "Api",
                Status = "Healthy",
                Description = "API is running"
            });

            return new SystemHealthViewModel
            {
                Status = checks.All(c => c.Status == "Healthy") ? "Healthy" : "Degraded",
                UptimeSeconds = (long)(DateTime.UtcNow - Process.GetCurrentProcess().StartTime.ToUniversalTime()).TotalSeconds,
                Checks = checks
            };
        }
    }
}
