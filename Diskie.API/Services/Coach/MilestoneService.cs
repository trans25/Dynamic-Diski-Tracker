using System.Globalization;
using System.Text.Json;
using Diskie.DataAccess.Model.Models.DbModels;
using Microsoft.EntityFrameworkCore;

namespace Diskie.API.Services.Coach
{
    public class MilestoneService : IMilestoneService
    {
        private readonly DiskiDbContext _db;

        public MilestoneService(DiskiDbContext db)
        {
            _db = db;
        }

        public async Task EvaluateAssessmentAsync(Assessment assessment, CancellationToken cancellationToken = default)
        {
            var goals = ReadMetricInt(assessment.Metrics, "goals") + (IsKind(ReadMetricString(assessment.Metrics, "kind"), "Goal") ? 1 : 0);
            var rating = assessment.OverallRating ?? ReadMetricDouble(assessment.Metrics, "rating");

            var matchAppearances = await _db.Assessments
                .Where(a => a.PlayerId == assessment.PlayerId && a.IsMatchAssessment)
                .Select(a => a.FixtureId)
                .Distinct()
                .CountAsync(cancellationToken);

            if (goals > 0)
            {
                var priorAssessments = await _db.Assessments
                    .Where(a => a.PlayerId == assessment.PlayerId
                        && a.IsMatchAssessment
                        && a.Id != assessment.Id)
                    .Select(a => a.Metrics)
                    .ToListAsync(cancellationToken);

                var hadGoalBefore = priorAssessments.Any(metrics =>
                    ReadMetricInt(metrics, "goals") > 0
                    || IsKind(ReadMetricString(metrics, "kind"), "Goal"));

                if (!hadGoalBefore)
                {
                    await CreateAchievementIfMissingAsync(
                        assessment.PlayerId,
                        "FirstGoal",
                        "First Goal",
                        "Scored their first official goal for the club.",
                        "sports_soccer",
                        null,
                        cancellationToken);
                }
            }

            if (matchAppearances >= 10)
            {
                await CreateAchievementIfMissingAsync(
                    assessment.PlayerId,
                    "TenAppearances",
                    "10 Appearances",
                    "Reached 10 match appearances.",
                    "looks_10",
                        null,
                    cancellationToken);
            }

            if (rating > 9.0)
            {
                await CreateAchievementIfMissingAsync(
                    assessment.PlayerId,
                    "EliteRating",
                    "Elite Rating",
                    $"Delivered an elite match rating of {rating.ToString("0.0", CultureInfo.InvariantCulture)}.",
                    "star",
                    assessment.FixtureId,
                    cancellationToken);
            }
        }

        private async Task CreateAchievementIfMissingAsync(
            Guid playerId,
            string type,
            string title,
            string description,
            string iconKey,
            Guid? fixtureId,
            CancellationToken cancellationToken)
        {
            var exists = await _db.PlayerAchievements.AnyAsync(
                pa => pa.PlayerId == playerId && pa.Type == type && pa.FixtureId == fixtureId,
                cancellationToken);
            if (exists)
            {
                return;
            }

            _db.PlayerAchievements.Add(new PlayerAchievement
            {
                Id = Guid.NewGuid(),
                PlayerId = playerId,
                Type = type,
                Title = title,
                Description = description,
                IconKey = iconKey,
                AwardedAt = DateTime.UtcNow,
                FixtureId = fixtureId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            });

            await _db.SaveChangesAsync(cancellationToken);
        }

        private static bool IsKind(string? value, string expected) =>
            string.Equals(value, expected, StringComparison.OrdinalIgnoreCase);

        private static string? ReadMetricString(Dictionary<string, object>? metrics, string key)
        {
            if (metrics is null)
            {
                return null;
            }

            foreach (var metric in metrics)
            {
                if (!string.Equals(metric.Key, key, StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                return metric.Value switch
                {
                    null => null,
                    JsonElement element when element.ValueKind == JsonValueKind.String => element.GetString(),
                    JsonElement element => element.ToString(),
                    _ => metric.Value.ToString()
                };
            }

            return null;
        }

        private static int ReadMetricInt(Dictionary<string, object>? metrics, string key)
        {
            if (metrics is null)
            {
                return 0;
            }

            foreach (var metric in metrics)
            {
                if (!string.Equals(metric.Key, key, StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                return metric.Value switch
                {
                    JsonElement element when element.ValueKind == JsonValueKind.Number && element.TryGetInt32(out var value) => value,
                    JsonElement element when element.ValueKind == JsonValueKind.String && int.TryParse(element.GetString(), out var parsed) => parsed,
                    _ => int.TryParse(metric.Value?.ToString(), out var parsed) ? parsed : 0,
                };
            }

            return 0;
        }

        private static double ReadMetricDouble(Dictionary<string, object>? metrics, string key)
        {
            if (metrics is null)
            {
                return 0;
            }

            foreach (var metric in metrics)
            {
                if (!string.Equals(metric.Key, key, StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                return metric.Value switch
                {
                    JsonElement element when element.ValueKind == JsonValueKind.Number && element.TryGetDouble(out var value) => value,
                    JsonElement element when element.ValueKind == JsonValueKind.String && double.TryParse(element.GetString(), NumberStyles.Any, CultureInfo.InvariantCulture, out var parsed) => parsed,
                    _ => double.TryParse(metric.Value?.ToString(), NumberStyles.Any, CultureInfo.InvariantCulture, out var parsed) ? parsed : 0,
                };
            }

            return 0;
        }
    }
}
