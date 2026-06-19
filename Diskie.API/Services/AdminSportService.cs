using System.Text.Json;
using Diskie.API.Mapping;
using Diskie.DataAccess.Model.Models.DbModels;
using Diskie.DataAccess.Model.Models.Enums;
using Diskie.DataAccess.Model.Models.ViewModels;
using Microsoft.EntityFrameworkCore;

namespace Diskie.API.Services
{
    public class AdminSportService : IAdminSportService
    {
        private readonly DiskiDbContext _dbContext;

        public AdminSportService(DiskiDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<IReadOnlyList<SportTemplateViewModel>> GetTemplatesAsync(CancellationToken cancellationToken = default)
        {
            return await _dbContext.SportTemplates
                .OrderBy(t => t.DisplayName)
                .Select(t => t.ToViewModel())
                .ToListAsync(cancellationToken);
        }

        public async Task<IReadOnlyList<SportTemplateViewModel>> GetActiveTemplatesAsync(CancellationToken cancellationToken = default)
        {
            return await _dbContext.SportTemplates
                .Where(t => t.IsActive)
                .OrderBy(t => t.DisplayName)
                .Select(t => t.ToViewModel())
                .ToListAsync(cancellationToken);
        }

        public async Task<SportTemplateViewModel> CreateTemplateAsync(CreateSportTemplateViewModel model, CancellationToken cancellationToken = default)
        {
            var now = DateTime.UtcNow;
            var metricDefinitions = ResolveMetricDefinitions(model.MetricDefinitions, model.MatchStatsFields);
            var positionDefinitions = ResolvePositionDefinitions(model.PositionDefinitions, model.PositionOptions);

            var template = new SportTemplate
            {
                Id = Guid.NewGuid(),
                Name = model.Name.Trim(),
                DisplayName = string.IsNullOrWhiteSpace(model.DisplayName) ? model.Name.Trim() : model.DisplayName.Trim(),
                SportType = model.SportType,
                Icon = model.Icon,
                Description = model.Description,
                MetricDefinitions = metricDefinitions,
                PositionDefinitions = positionDefinitions,
                MatchStatsFields = ParseMetricFields(metricDefinitions),
                PositionOptions = ParsePositionOptions(positionDefinitions),
                AssessmentMetrics = model.AssessmentMetrics,
                DefaultSeasonWeeks = model.DefaultSeasonWeeks,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now
            };

            _dbContext.SportTemplates.Add(template);
            await _dbContext.SaveChangesAsync(cancellationToken);
            return template.ToViewModel();
        }

        public async Task<IReadOnlyList<PendingSportRequestViewModel>> GetPendingRequestsAsync(CancellationToken cancellationToken = default)
        {
            return await _dbContext.TenantSportRequests
                .Where(r => r.Status == SportRequestStatus.Pending)
                .OrderBy(r => r.RequestedDate)
                .Select(r => new PendingSportRequestViewModel
                {
                    Id = r.Id,
                    TenantId = r.TenantId,
                    TenantName = r.Tenant.Name,
                    TenantEmail = r.Tenant.Email,
                    City = r.Tenant.City,
                    Province = r.Tenant.Province,
                    RequestedSportTemplateId = r.RequestedSportTemplateId,
                    RequestedSportTemplateName = r.RequestedSportTemplate.DisplayName,
                    SportType = r.RequestedSportTemplate.SportType,
                    Status = r.Status,
                    RequestedDate = r.RequestedDate
                })
                .ToListAsync(cancellationToken);
        }

        public async Task<bool> ApproveRequestAsync(Guid requestId, CancellationToken cancellationToken = default)
        {
            var request = await _dbContext.TenantSportRequests
                .Include(r => r.Tenant)
                .FirstOrDefaultAsync(r => r.Id == requestId, cancellationToken);

            if (request is null)
            {
                return false;
            }

            request.Status = SportRequestStatus.Approved;
            request.Tenant.AssignedSportTemplateId = request.RequestedSportTemplateId;
            request.Tenant.IsApproved = true;
            request.Tenant.UpdatedAt = DateTime.UtcNow;
            request.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task<bool> RejectRequestAsync(Guid requestId, CancellationToken cancellationToken = default)
        {
            var request = await _dbContext.TenantSportRequests
                .FirstOrDefaultAsync(r => r.Id == requestId, cancellationToken);

            if (request is null)
            {
                return false;
            }

            request.Status = SportRequestStatus.Rejected;
            request.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }

        private static string ResolveMetricDefinitions(string? raw, IEnumerable<MatchStatField>? fields)
        {
            if (!string.IsNullOrWhiteSpace(raw))
            {
                using var _ = JsonDocument.Parse(raw);
                return raw;
            }

            var fallback = (fields ?? Array.Empty<MatchStatField>())
                .Select(field => new MetricDefinitionItem
                {
                    Key = field.Key,
                    Label = string.IsNullOrWhiteSpace(field.DisplayName) ? field.Key : field.DisplayName
                })
                .ToList();

            return JsonSerializer.Serialize(fallback);
        }

        private static string ResolvePositionDefinitions(string? raw, IEnumerable<string>? positions)
        {
            if (!string.IsNullOrWhiteSpace(raw))
            {
                using var _ = JsonDocument.Parse(raw);
                return raw;
            }

            return JsonSerializer.Serialize((positions ?? Array.Empty<string>()).Where(p => !string.IsNullOrWhiteSpace(p)));
        }

        private static List<MatchStatField> ParseMetricFields(string json)
        {
            return ParseMetricItems(json)
                .Select(item => new MatchStatField
                {
                    Key = item.Key,
                    DisplayName = item.Label,
                    Type = "number"
                })
                .ToList();
        }

        private static List<string> ParsePositionOptions(string json)
        {
            try
            {
                using var document = JsonDocument.Parse(json);
                return document.RootElement.ValueKind switch
                {
                    JsonValueKind.Array => document.RootElement
                        .EnumerateArray()
                        .Select(item => item.ValueKind == JsonValueKind.String ? item.GetString() : null)
                        .Where(item => !string.IsNullOrWhiteSpace(item))
                        .Cast<string>()
                        .ToList(),
                    JsonValueKind.Object => document.RootElement
                        .EnumerateObject()
                        .Select(item => item.Value.GetString() ?? item.Name)
                        .Where(item => !string.IsNullOrWhiteSpace(item))
                        .ToList(),
                    _ => new List<string>()
                };
            }
            catch
            {
                return new List<string>();
            }
        }

        private static List<MetricDefinitionItem> ParseMetricItems(string json)
        {
            try
            {
                using var document = JsonDocument.Parse(json);
                if (document.RootElement.ValueKind == JsonValueKind.Object)
                {
                    return document.RootElement
                        .EnumerateObject()
                        .Select(item => new MetricDefinitionItem
                        {
                            Key = item.Name,
                            Label = item.Value.GetString() ?? item.Name
                        })
                        .ToList();
                }

                if (document.RootElement.ValueKind == JsonValueKind.Array)
                {
                    return document.RootElement
                        .EnumerateArray()
                        .Select(item => new MetricDefinitionItem
                        {
                            Key = item.TryGetProperty("key", out var key) ? key.GetString() ?? string.Empty : string.Empty,
                            Label = item.TryGetProperty("label", out var label) ? label.GetString() ?? string.Empty : string.Empty
                        })
                        .Where(item => !string.IsNullOrWhiteSpace(item.Key) && !string.IsNullOrWhiteSpace(item.Label))
                        .ToList();
                }
            }
            catch
            {
                return new List<MetricDefinitionItem>();
            }

            return new List<MetricDefinitionItem>();
        }

        private sealed class MetricDefinitionItem
        {
            public string Key { get; set; } = string.Empty;
            public string Label { get; set; } = string.Empty;
        }
    }
}