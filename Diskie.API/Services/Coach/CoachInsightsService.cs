using System.Globalization;
using System.Text.Json;
using Diskie.API.Security;
using Diskie.DataAccess.Contracts;
using Diskie.DataAccess.Model.Models.DbModels;
using Diskie.DataAccess.Model.Models.Enums;
using Diskie.DataAccess.Model.Models.ViewModels;
using Microsoft.EntityFrameworkCore;

namespace Diskie.API.Services.Coach
{
    public class CoachInsightsService : ICoachInsightsService
    {
        private readonly IRepositoryWrapper _repository;
        private readonly ICurrentUserContext _currentUser;
        private readonly DiskiDbContext _db;

        public CoachInsightsService(IRepositoryWrapper repository, ICurrentUserContext currentUser, DiskiDbContext db)
        {
            _repository = repository;
            _currentUser = currentUser;
            _db = db;
        }

        public async Task<IReadOnlyList<PlayerGrowthPointViewModel>> GetPlayerGrowthAsync(Guid playerId, string? season = null, CancellationToken cancellationToken = default)
        {
            if (!IsPlayerInCoachTeams(playerId))
            {
                return new List<PlayerGrowthPointViewModel>();
            }

            var pointsQuery = _repository.Assessment
                .FindByCondition(a => a.PlayerId == playerId && a.IsMatchAssessment && a.OverallRating.HasValue);

            if (!string.IsNullOrWhiteSpace(season) && !string.Equals(season, "all", StringComparison.OrdinalIgnoreCase))
            {
                pointsQuery = pointsQuery.Where(a =>
                    (a.Team.Season.AcademicYear.HasValue && a.Team.Season.AcademicYear.Value.ToString() == season)
                    || a.Team.Season.Name.Contains(season));
            }

            var points = await pointsQuery
                .OrderByDescending(a => a.AssessmentDate)
                .ThenByDescending(a => a.CreatedAt)
                .Take(10)
                .Select(a => new
                {
                    a.AssessmentDate,
                    Rating = a.OverallRating!.Value,
                    a.Metrics
                })
                .ToListAsync(cancellationToken);

            return points
                .OrderBy(p => p.AssessmentDate)
                .Select(p => new PlayerGrowthPointViewModel
                {
                    MatchDate = p.AssessmentDate,
                    Rating = p.Rating,
                    Goals = ReadMetricInt(p.Metrics, "goals") + (IsKind(ReadMetricString(p.Metrics, "kind"), "Goal") ? 1 : 0),
                    Assists = ReadMetricInt(p.Metrics, "assists") + (IsKind(ReadMetricString(p.Metrics, "kind"), "Assist") ? 1 : 0)
                })
                .ToList();
        }

        public async Task<PlayerSkillsViewModel?> GetPlayerSkillsAsync(Guid playerId, CancellationToken cancellationToken = default)
        {
            if (!IsPlayerInCoachTeams(playerId))
            {
                return null;
            }

            var latest = await _db.PlayerSkills
                .Where(ps => ps.PlayerId == playerId)
                .OrderByDescending(ps => ps.Season)
                .ThenByDescending(ps => ps.CreatedAt)
                .Select(ps => new
                {
                    ps.PlayerId,
                    PlayerName = (ps.Player.FirstName + " " + ps.Player.LastName).Trim(),
                    ps.Season,
                    ps.Attacking,
                    ps.Defending,
                    ps.Passing,
                    ps.Physicality,
                    ps.Composure
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (latest is null)
            {
                return null;
            }

            var squadTeamIds = GetCoachTeamIds();
            var squadPlayerIds = await _repository.TeamPlayer
                .FindByCondition(tp => squadTeamIds.Contains(tp.TeamId) && tp.IsActive)
                .Select(tp => tp.PlayerId)
                .Distinct()
                .ToListAsync(cancellationToken);

            var seasonSkills = await _db.PlayerSkills
                .Where(ps => squadPlayerIds.Contains(ps.PlayerId) && ps.Season == latest.Season)
                .ToListAsync(cancellationToken);

            var avgAttacking = seasonSkills.Count == 0 ? latest.Attacking : seasonSkills.Average(x => x.Attacking);
            var avgDefending = seasonSkills.Count == 0 ? latest.Defending : seasonSkills.Average(x => x.Defending);
            var avgPassing = seasonSkills.Count == 0 ? latest.Passing : seasonSkills.Average(x => x.Passing);
            var avgPhysicality = seasonSkills.Count == 0 ? latest.Physicality : seasonSkills.Average(x => x.Physicality);
            var avgComposure = seasonSkills.Count == 0 ? latest.Composure : seasonSkills.Average(x => x.Composure);

            return new PlayerSkillsViewModel
            {
                PlayerId = latest.PlayerId,
                PlayerName = latest.PlayerName,
                Season = latest.Season,
                Points = new List<PlayerSkillRadarPointViewModel>
                {
                    new() { Skill = "Attacking", PlayerValue = latest.Attacking, SquadAverage = Math.Round(avgAttacking, 2) },
                    new() { Skill = "Defending", PlayerValue = latest.Defending, SquadAverage = Math.Round(avgDefending, 2) },
                    new() { Skill = "Passing", PlayerValue = latest.Passing, SquadAverage = Math.Round(avgPassing, 2) },
                    new() { Skill = "Physicality", PlayerValue = latest.Physicality, SquadAverage = Math.Round(avgPhysicality, 2) },
                    new() { Skill = "Composure", PlayerValue = latest.Composure, SquadAverage = Math.Round(avgComposure, 2) },
                }
            };
        }

        public async Task<IReadOnlyList<PlayerAchievementViewModel>> GetPlayerAchievementsAsync(Guid playerId, CancellationToken cancellationToken = default)
        {
            if (!IsPlayerInCoachTeams(playerId))
            {
                return new List<PlayerAchievementViewModel>();
            }

            return await _db.PlayerAchievements
                .Where(pa => pa.PlayerId == playerId)
                .OrderByDescending(pa => pa.AwardedAt)
                .Select(pa => new PlayerAchievementViewModel
                {
                    Id = pa.Id,
                    PlayerId = pa.PlayerId,
                    Type = pa.Type,
                    Title = pa.Title,
                    Description = pa.Description,
                    IconKey = pa.IconKey,
                    AwardedAt = pa.AwardedAt
                })
                .ToListAsync(cancellationToken);
        }

        public async Task<IReadOnlyList<SquadAttendanceSummaryViewModel>> GetSquadAttendanceAsync(Guid? teamId, DateOnly? sessionDate, CancellationToken cancellationToken = default)
        {
            var teamIds = GetCoachTeamIds();
            if (teamId.HasValue)
            {
                if (!teamIds.Contains(teamId.Value))
                {
                    return new List<SquadAttendanceSummaryViewModel>();
                }

                teamIds = new List<Guid> { teamId.Value };
            }

            var roster = await _repository.TeamPlayer
                .FindByCondition(tp => teamIds.Contains(tp.TeamId) && tp.IsActive)
                .Select(tp => new
                {
                    tp.PlayerId,
                    PlayerName = (tp.Player.FirstName + " " + tp.Player.LastName).Trim()
                })
                .Distinct()
                .ToListAsync(cancellationToken);

            var rosterPlayerIds = roster.Select(r => r.PlayerId).ToList();
            var history = await _db.TrainingAttendances
                .Where(ta => rosterPlayerIds.Contains(ta.PlayerId))
                .ToListAsync(cancellationToken);

            return roster
                .Select(player =>
                {
                    var sessions = history.Where(h => h.PlayerId == player.PlayerId).ToList();
                    var totalSessions = sessions.Count;
                    var presentSessions = sessions.Count(x => x.IsPresent);
                    var selectedSession = sessionDate.HasValue
                        ? sessions.FirstOrDefault(x => x.SessionDate == sessionDate.Value)
                        : null;

                    return new SquadAttendanceSummaryViewModel
                    {
                        PlayerId = player.PlayerId,
                        PlayerName = player.PlayerName,
                        AttendancePercentage = totalSessions == 0 ? 0 : Math.Round((double)presentSessions / totalSessions * 100, 1),
                        PresentSessions = presentSessions,
                        TotalSessions = totalSessions,
                        IsPresentForSession = selectedSession?.IsPresent,
                        IsLateForSession = selectedSession?.IsLate
                    };
                })
                .OrderBy(x => x.PlayerName)
                .ToList();
        }

        public async Task<SquadAttendanceSummaryViewModel?> MarkTrainingAttendanceAsync(MarkTrainingAttendanceViewModel model, CancellationToken cancellationToken = default)
        {
            if (!IsPlayerInCoachTeams(model.PlayerId))
            {
                return null;
            }

            var row = await _db.TrainingAttendances
                .FirstOrDefaultAsync(ta => ta.PlayerId == model.PlayerId && ta.SessionDate == model.SessionDate, cancellationToken);

            if (row is null)
            {
                row = new TrainingAttendance
                {
                    Id = Guid.NewGuid(),
                    PlayerId = model.PlayerId,
                    SessionDate = model.SessionDate,
                    IsPresent = model.IsPresent,
                    IsLate = model.IsPresent && model.IsLate,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                };
                _db.TrainingAttendances.Add(row);
            }
            else
            {
                row.IsPresent = model.IsPresent;
                row.IsLate = model.IsPresent && model.IsLate;
                row.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync(cancellationToken);

            return (await GetSquadAttendanceAsync(null, model.SessionDate, cancellationToken))
                .FirstOrDefault(x => x.PlayerId == model.PlayerId);
        }

        public async Task<IReadOnlyList<SquadFatigueItemViewModel>> GetSquadFatigueAsync(CancellationToken cancellationToken = default)
        {
            var teamIds = GetCoachTeamIds();
            if (teamIds.Count == 0)
            {
                return new List<SquadFatigueItemViewModel>();
            }

            var since = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-7));

            var players = await _repository.TeamPlayer
                .FindByCondition(tp => teamIds.Contains(tp.TeamId) && tp.IsActive)
                .Select(tp => new
                {
                    tp.PlayerId,
                    PlayerName = (tp.Player.FirstName + " " + tp.Player.LastName).Trim()
                })
                .Distinct()
                .ToListAsync(cancellationToken);

            var attendance = await _repository.Attendance
                .FindByCondition(a => teamIds.Contains(a.TeamId)
                    && a.SessionDate >= since
                    && (a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.Late))
                .Select(a => new { a.PlayerId, a.SessionType })
                .ToListAsync(cancellationToken);

            var minutesByPlayer = attendance
                .GroupBy(a => a.PlayerId)
                .ToDictionary(
                    g => g.Key,
                    g => g.Sum(x => string.Equals(x.SessionType, "training", StringComparison.OrdinalIgnoreCase) ? 60 : 90));

            return players
                .Select(p =>
                {
                    var minutes = minutesByPlayer.TryGetValue(p.PlayerId, out var val) ? val : 0;
                    return new SquadFatigueItemViewModel
                    {
                        PlayerId = p.PlayerId,
                        PlayerName = p.PlayerName,
                        MinutesPlayedLast7Days = minutes,
                        Status = minutes > 270 ? "Exhausted" : minutes > 180 ? "Tired" : "Fit"
                    };
                })
                .OrderByDescending(x => x.MinutesPlayedLast7Days)
                .ToList();
        }

        public async Task<IReadOnlyList<PositionalDepthItemViewModel>> GetPositionalDepthAsync(CancellationToken cancellationToken = default)
        {
            var teamIds = GetCoachTeamIds();
            if (teamIds.Count == 0)
            {
                return new List<PositionalDepthItemViewModel>();
            }

            var players = await _repository.TeamPlayer
                .FindByCondition(tp => teamIds.Contains(tp.TeamId) && tp.IsActive)
                .Select(tp => new
                {
                    tp.PlayerId,
                    Position = string.IsNullOrWhiteSpace(tp.Position)
                        ? (string.IsNullOrWhiteSpace(tp.Player.PreferredPosition) ? "Unknown" : tp.Player.PreferredPosition!)
                        : tp.Position!
                })
                .Distinct()
                .ToListAsync(cancellationToken);

            var ratings = await _repository.Assessment
                .FindByCondition(a => teamIds.Contains(a.TeamId) && a.IsMatchAssessment && a.OverallRating.HasValue)
                .Select(a => new { a.PlayerId, Rating = (double)a.OverallRating!.Value })
                .ToListAsync(cancellationToken);

            var avgByPlayer = ratings
                .GroupBy(r => r.PlayerId)
                .ToDictionary(g => g.Key, g => g.Average(x => x.Rating));

            var byPosition = players
                .GroupBy(p => p.Position)
                .Select(g => new
                {
                    Position = g.Key,
                    Avg = g.Select(p => avgByPlayer.TryGetValue(p.PlayerId, out var rating) ? rating : 0d).Average()
                })
                .ToList();

            var squadAvg = byPosition.Count == 0 ? 0 : byPosition.Average(x => x.Avg);

            return byPosition
                .OrderBy(x => x.Position)
                .Select(x => new PositionalDepthItemViewModel
                {
                    Position = x.Position,
                    AverageRating = Math.Round(x.Avg, 2),
                    SquadAverage = Math.Round(squadAvg, 2),
                    IsBelowSquadAverage = x.Avg < squadAvg
                })
                .ToList();
        }

        public async Task<IReadOnlyList<TrainingMatchCorrelationPointViewModel>> GetTrainingCorrelationAsync(CancellationToken cancellationToken = default)
        {
            var teamIds = GetCoachTeamIds();
            if (teamIds.Count == 0)
            {
                return new List<TrainingMatchCorrelationPointViewModel>();
            }

            var latestMatchDate = await _repository.Fixture
                .FindByCondition(f => teamIds.Contains(f.TeamId) && !f.IsTraining && f.FixtureDate < DateOnly.FromDateTime(DateTime.UtcNow))
                .OrderByDescending(f => f.FixtureDate)
                .Select(f => (DateOnly?)f.FixtureDate)
                .FirstOrDefaultAsync(cancellationToken);

            if (!latestMatchDate.HasValue)
            {
                return new List<TrainingMatchCorrelationPointViewModel>();
            }

            var matchDate = latestMatchDate.Value;
            var fromDate = matchDate.AddDays(-7);

            var roster = await _repository.TeamPlayer
                .FindByCondition(tp => teamIds.Contains(tp.TeamId) && tp.IsActive)
                .Select(tp => new
                {
                    tp.PlayerId,
                    PlayerName = (tp.Player.FirstName + " " + tp.Player.LastName).Trim()
                })
                .Distinct()
                .ToListAsync(cancellationToken);

            var attendance = await _repository.Attendance
                .FindByCondition(a => teamIds.Contains(a.TeamId)
                    && a.SessionType == "training"
                    && a.SessionDate >= fromDate
                    && a.SessionDate <= matchDate
                    && (a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.Late))
                .Select(a => new { a.PlayerId })
                .ToListAsync(cancellationToken);

            var trainingCount = attendance
                .GroupBy(a => a.PlayerId)
                .ToDictionary(g => g.Key, g => g.Count());

            var ratings = await _repository.Assessment
                .FindByCondition(a => teamIds.Contains(a.TeamId)
                    && a.IsMatchAssessment
                    && a.AssessmentDate == matchDate
                    && a.OverallRating.HasValue)
                .Select(a => new { a.PlayerId, Rating = (double)a.OverallRating!.Value })
                .ToListAsync(cancellationToken);

            var ratingByPlayer = ratings
                .GroupBy(r => r.PlayerId)
                .ToDictionary(g => g.Key, g => g.Average(x => x.Rating));

            return roster
                .Where(r => ratingByPlayer.ContainsKey(r.PlayerId))
                .Select(r => new TrainingMatchCorrelationPointViewModel
                {
                    PlayerId = r.PlayerId,
                    PlayerName = r.PlayerName,
                    TrainingCount = trainingCount.TryGetValue(r.PlayerId, out var tc) ? tc : 0,
                    MatchRating = Math.Round(ratingByPlayer[r.PlayerId], 2)
                })
                .OrderByDescending(x => x.MatchRating)
                .ToList();
        }

        public async Task<IReadOnlyList<ChemistryPairViewModel>> GetTopChemistryPairsAsync(int top = 5, CancellationToken cancellationToken = default)
        {
            var teamIds = GetCoachTeamIds();
            if (teamIds.Count == 0)
            {
                return new List<ChemistryPairViewModel>();
            }

            var completedFixtures = await _repository.Fixture
                .FindByCondition(f => teamIds.Contains(f.TeamId)
                    && !f.IsTraining
                    && f.FixtureDate < DateOnly.FromDateTime(DateTime.UtcNow)
                    && f.Result.HasValue)
                .Select(f => new
                {
                    f.Id,
                    f.TeamId,
                    f.Result,
                    TeamGoals = (f.HomeScore ?? 0) + (f.AwayScore ?? 0)
                })
                .ToListAsync(cancellationToken);

            if (completedFixtures.Count == 0)
            {
                return new List<ChemistryPairViewModel>();
            }

            var fixtureIds = completedFixtures.Select(f => f.Id).ToList();

            var presentAttendance = await _repository.Attendance
                .FindByCondition(a => a.FixtureId.HasValue
                    && fixtureIds.Contains(a.FixtureId.Value)
                    && (a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.Late))
                .Select(a => new { FixtureId = a.FixtureId!.Value, a.PlayerId })
                .ToListAsync(cancellationToken);

            var playerNames = await _repository.User
                .FindByCondition(u => presentAttendance.Select(pa => pa.PlayerId).Contains(u.Id))
                .Select(u => new { u.Id, Name = (u.FirstName + " " + u.LastName).Trim() })
                .ToDictionaryAsync(x => x.Id, x => x.Name, cancellationToken);

            var contributionEvents = await _repository.Assessment
                .FindByCondition(a => a.FixtureId.HasValue && fixtureIds.Contains(a.FixtureId.Value) && a.IsMatchAssessment)
                .Select(a => new { FixtureId = a.FixtureId!.Value, a.PlayerId, a.Metrics })
                .ToListAsync(cancellationToken);

            var contributionByFixtureAndPlayer = contributionEvents
                .GroupBy(e => new { e.FixtureId, e.PlayerId })
                .ToDictionary(
                    g => g.Key,
                    g => g.Sum(x =>
                        ReadMetricInt(x.Metrics, "goals") +
                        ReadMetricInt(x.Metrics, "assists") +
                        (IsKind(ReadMetricString(x.Metrics, "kind"), "Goal") ? 1 : 0) +
                        (IsKind(ReadMetricString(x.Metrics, "kind"), "Assist") ? 1 : 0)
                    ));

            var pairs = new Dictionary<(Guid A, Guid B), PairAccumulator>();

            foreach (var fixture in completedFixtures)
            {
                var players = presentAttendance
                    .Where(pa => pa.FixtureId == fixture.Id)
                    .Select(pa => pa.PlayerId)
                    .Distinct()
                    .ToList();

                for (var i = 0; i < players.Count; i++)
                {
                    for (var j = i + 1; j < players.Count; j++)
                    {
                        var a = players[i];
                        var b = players[j];
                        var key = a.CompareTo(b) < 0 ? (a, b) : (b, a);

                        if (!pairs.TryGetValue(key, out var acc))
                        {
                            acc = new PairAccumulator();
                            pairs[key] = acc;
                        }

                        acc.MatchesTogether += 1;
                        if (fixture.Result == FixtureResult.Win)
                        {
                            acc.Wins += 1;
                        }

                        acc.TeamGoals += fixture.TeamGoals;

                        var aContrib = contributionByFixtureAndPlayer.TryGetValue(new { FixtureId = fixture.Id, PlayerId = a }, out var ac) ? ac : 0;
                        var bContrib = contributionByFixtureAndPlayer.TryGetValue(new { FixtureId = fixture.Id, PlayerId = b }, out var bc) ? bc : 0;
                        acc.CombinedContributions += aContrib + bContrib;
                    }
                }
            }

            return pairs
                .Where(x => x.Value.MatchesTogether > 0)
                .Select(x => new ChemistryPairViewModel
                {
                    PlayerAId = x.Key.A,
                    PlayerAName = playerNames.TryGetValue(x.Key.A, out var an) ? an : x.Key.A.ToString(),
                    PlayerBId = x.Key.B,
                    PlayerBName = playerNames.TryGetValue(x.Key.B, out var bn) ? bn : x.Key.B.ToString(),
                    MatchesTogether = x.Value.MatchesTogether,
                    GoalsPerGame = Math.Round((double)x.Value.TeamGoals / x.Value.MatchesTogether, 2),
                    WinPercentage = Math.Round((double)x.Value.Wins / x.Value.MatchesTogether * 100, 2),
                    CombinedGoalContributionsPerGame = Math.Round((double)x.Value.CombinedContributions / x.Value.MatchesTogether, 2)
                })
                .OrderByDescending(x => x.CombinedGoalContributionsPerGame)
                .ThenByDescending(x => x.WinPercentage)
                .Take(Math.Clamp(top, 1, 20))
                .ToList();
        }

        private List<Guid> GetCoachTeamIds()
        {
            return _repository.TeamCoach
                .FindByCondition(tc => tc.CoachId == _currentUser.UserId && tc.Team.TenantId == _currentUser.TenantId)
                .Select(tc => tc.TeamId)
                .Distinct()
                .ToList();
        }

        private bool IsPlayerInCoachTeams(Guid playerId)
        {
            var teamIds = GetCoachTeamIds();
            return _repository.TeamPlayer
                .FindByCondition(tp => tp.PlayerId == playerId && teamIds.Contains(tp.TeamId))
                .Any();
        }

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

                return ConvertToInt(metric.Value);
            }

            return 0;
        }

        private static int ConvertToInt(object? value)
        {
            switch (value)
            {
                case null:
                    return 0;
                case JsonElement element when element.ValueKind == JsonValueKind.Number && element.TryGetInt32(out var intVal):
                    return intVal;
                case JsonElement element when element.ValueKind == JsonValueKind.String && int.TryParse(element.GetString(), NumberStyles.Any, CultureInfo.InvariantCulture, out var fromStr):
                    return fromStr;
                default:
                    return int.TryParse(value?.ToString(), NumberStyles.Any, CultureInfo.InvariantCulture, out var parsed)
                        ? parsed
                        : 0;
            }
        }

        private static bool IsKind(string? value, string expected) =>
            string.Equals(value, expected, StringComparison.OrdinalIgnoreCase);

        private sealed class PairAccumulator
        {
            public int MatchesTogether { get; set; }
            public int Wins { get; set; }
            public int TeamGoals { get; set; }
            public int CombinedContributions { get; set; }
        }
    }
}
