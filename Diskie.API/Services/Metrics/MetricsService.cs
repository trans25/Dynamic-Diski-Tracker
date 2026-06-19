using System.Globalization;
using System.Text.Json;
using Diskie.DataAccess.Contracts;
using Diskie.DataAccess.Model.Models.Enums;
using Diskie.DataAccess.Model.Models.ViewModels;
using Microsoft.EntityFrameworkCore;

namespace Diskie.API.Services.Metrics
{
    public class MetricsService : IMetricsService
    {
        private readonly IRepositoryWrapper _repository;

        public MetricsService(IRepositoryWrapper repository)
        {
            _repository = repository;
        }

        public async Task<MetricInsightsViewModel?> GetMatchInsightsAsync(Guid matchId, CancellationToken cancellationToken = default)
        {
            var match = await _repository.Fixture
                .FindByCondition(f => f.Id == matchId)
                .FirstOrDefaultAsync(cancellationToken);
            if (match is null)
            {
                return null;
            }

            var teamId = match.TeamId;

            // Metric 1: Current Form - last 5 completed matches for this club.
            // Points: Win = 3, Draw = 1, Loss = 0. Form = Total Points / 15.
            var recentMatches = await _repository.Fixture
                .FindByCondition(f => f.TeamId == teamId &&
                    (f.Result == FixtureResult.Win || f.Result == FixtureResult.Draw || f.Result == FixtureResult.Loss))
                .OrderByDescending(f => f.FixtureDate)
                .ThenByDescending(f => f.StartTime)
                .Take(5)
                .ToListAsync(cancellationToken);

            var totalPoints = recentMatches.Sum(f =>
                f.Result == FixtureResult.Win ? 3 :
                f.Result == FixtureResult.Draw ? 1 : 0);
            var form = totalPoints / 15.0;

            // Metric 2: Head-to-Head - all completed matches against this opponent.
            // H2H = (Wins + (Draws * 0.5)) / TotalMatches.
            var h2h = 0.0;
            if (!string.IsNullOrWhiteSpace(match.Opponent))
            {
                var h2hMatches = await _repository.Fixture
                    .FindByCondition(f => f.TeamId == teamId &&
                        f.Opponent == match.Opponent &&
                        (f.Result == FixtureResult.Win || f.Result == FixtureResult.Draw || f.Result == FixtureResult.Loss))
                    .ToListAsync(cancellationToken);

                if (h2hMatches.Count > 0)
                {
                    var wins = h2hMatches.Count(f => f.Result == FixtureResult.Win);
                    var draws = h2hMatches.Count(f => f.Result == FixtureResult.Draw);
                    h2h = (wins + (draws * 0.5)) / h2hMatches.Count;
                }
            }

            // Metric 3: Best Player Impact - group performances (assessments) by player.
            // Metric Score = (AVG(Rating) * 5) + (SUM(Goals) * 3) + (SUM(Assists) * 2).
            // The Metrics column is jsonb, so aggregation is done in memory.
            var assessments = await _repository.Assessment
                .FindByCondition(a => a.TeamId == teamId)
                .Select(a => new { a.PlayerId, a.OverallRating, a.Metrics })
                .ToListAsync(cancellationToken);

            var topPlayer = assessments
                .GroupBy(a => a.PlayerId)
                .Select(g =>
                {
                    var ratings = g
                        .Where(x => x.OverallRating.HasValue)
                        .Select(x => (double)x.OverallRating!.Value)
                        .ToList();
                    var avgRating = ratings.Count > 0 ? ratings.Average() : 0.0;
                    var totalGoals = g.Sum(x => ReadMetric(x.Metrics, "goals"));
                    var totalAssists = g.Sum(x => ReadMetric(x.Metrics, "assists"));

                    return new
                    {
                        PlayerId = g.Key,
                        MetricScore = (avgRating * 5) + (totalGoals * 3) + (totalAssists * 2)
                    };
                })
                .OrderByDescending(p => p.MetricScore)
                .FirstOrDefault();

            var starPlayerName = "N/A";
            var starPlayerMetricScore = 0.0;
            if (topPlayer is not null)
            {
                starPlayerMetricScore = topPlayer.MetricScore;
                var player = await _repository.User
                    .FindByCondition(u => u.Id == topPlayer.PlayerId)
                    .Select(u => new { u.FirstName, u.LastName })
                    .FirstOrDefaultAsync(cancellationToken);
                if (player is not null)
                {
                    starPlayerName = $"{player.FirstName} {player.LastName}".Trim();
                }
            }

            // Formation logic (strict IF/ELSE based on metrics).
            string formation;
            string advice;
            if (form >= 0.65 && h2h >= 0.60)
            {
                formation = "4-3-3 (Attacking)";
                advice = "Your metrics show dominance. Attack relentlessly!";
            }
            else if (form <= 0.35 || h2h <= 0.30)
            {
                formation = "5-4-1 (Defensive)";
                advice = "Metrics suggest a tough opponent. Stay compact.";
            }
            else
            {
                formation = "4-4-2 (Balanced)";
                advice = "Metrics are even. Control the midfield.";
            }

            return new MetricInsightsViewModel
            {
                Formation = formation,
                Advice = advice,
                FormScore = Math.Round(form * 100, 2),
                H2HScore = Math.Round(h2h * 100, 2),
                StarPlayerName = starPlayerName,
                StarPlayerMetricScore = Math.Round(starPlayerMetricScore, 2)
            };
        }

        private static double ReadMetric(Dictionary<string, object>? metrics, string key)
        {
            if (metrics is null)
            {
                return 0.0;
            }

            foreach (var kvp in metrics)
            {
                if (string.Equals(kvp.Key, key, StringComparison.OrdinalIgnoreCase))
                {
                    return ConvertToDouble(kvp.Value);
                }
            }

            return 0.0;
        }

        private static double ConvertToDouble(object? value)
        {
            switch (value)
            {
                case null:
                    return 0.0;
                case JsonElement element:
                    return element.ValueKind == JsonValueKind.Number && element.TryGetDouble(out var parsed)
                        ? parsed
                        : 0.0;
                default:
                    try
                    {
                        return Convert.ToDouble(value, CultureInfo.InvariantCulture);
                    }
                    catch
                    {
                        return 0.0;
                    }
            }
        }
    }
}
