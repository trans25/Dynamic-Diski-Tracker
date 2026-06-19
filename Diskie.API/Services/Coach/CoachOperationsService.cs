using System.Globalization;
using System.Text.Json;
using CsvHelper;
using Diskie.API.Mapping;
using Diskie.API.Security;
using Diskie.DataAccess.Contracts;
using Diskie.DataAccess.Model.DbModels;
using Diskie.DataAccess.Model.Models.DbModels;
using Diskie.DataAccess.Model.Models.Enums;
using Diskie.DataAccess.Model.Models.ViewModels;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Diskie.API.Services.Coach
{
    public class CoachOperationsService : ICoachOperationsService
    {
        private readonly IRepositoryWrapper _repository;
        private readonly ICurrentUserContext _currentUser;
        private readonly DiskiDbContext _db;
        private readonly ICoachInsightsService _insights;

        public CoachOperationsService(IRepositoryWrapper repository, ICurrentUserContext currentUser, DiskiDbContext db, ICoachInsightsService insights)
        {
            _repository = repository;
            _currentUser = currentUser;
            _db = db;
            _insights = insights;
        }

        public async Task<IReadOnlyList<MatchAvailabilityItemViewModel>> GetMatchAvailabilityAsync(Guid matchId, CancellationToken cancellationToken = default)
        {
            var fixture = await GetAssignedFixtureAsync(matchId, cancellationToken);
            if (fixture is null)
            {
                return new List<MatchAvailabilityItemViewModel>();
            }

            var roster = await GetTeamRosterAsync(fixture.TeamId, cancellationToken);
            var availability = await _db.Availabilities
                .Where(a => a.FixtureId == matchId)
                .ToListAsync(cancellationToken);

            return roster.Select(player =>
            {
                var row = availability.FirstOrDefault(a => a.PlayerId == player.PlayerId);
                return new MatchAvailabilityItemViewModel
                {
                    PlayerId = player.PlayerId,
                    PlayerName = player.PlayerName,
                    Position = player.Position,
                    Status = row?.Status.ToString() ?? AvailabilityStatus.NoResponse.ToString(),
                    ResponseDate = row?.ResponseTimestamp,
                };
            }).OrderBy(x => x.PlayerName).ToList();
        }

        public async Task<IReadOnlyList<MatchAvailabilityItemViewModel>> RequestAvailabilityAsync(Guid matchId, IReadOnlyList<Guid> playerIds, CancellationToken cancellationToken = default)
        {
            var fixture = await GetAssignedFixtureAsync(matchId, cancellationToken);
            if (fixture is null)
            {
                return new List<MatchAvailabilityItemViewModel>();
            }

            var roster = await GetTeamRosterAsync(fixture.TeamId, cancellationToken);
            var allowedIds = roster.Select(r => r.PlayerId).ToHashSet();
            var targets = (playerIds.Count == 0 ? allowedIds : playerIds.Where(allowedIds.Contains).ToHashSet());
            var existing = await _db.Availabilities
                .Where(a => a.FixtureId == matchId && targets.Contains(a.PlayerId))
                .ToListAsync(cancellationToken);

            foreach (var playerId in targets)
            {
                if (existing.Any(a => a.PlayerId == playerId))
                {
                    continue;
                }

                _db.Availabilities.Add(new Availability
                {
                    Id = Guid.NewGuid(),
                    PlayerId = playerId,
                    FixtureId = fixture.Id,
                    TeamId = fixture.TeamId,
                    Status = AvailabilityStatus.NoResponse,
                    ResponseSource = "request",
                    ResponseTimestamp = null,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                });
            }

            await _db.SaveChangesAsync(cancellationToken);
            return await GetMatchAvailabilityAsync(matchId, cancellationToken);
        }

        public async Task<IReadOnlyList<MatchAvailabilityItemViewModel>> UpdateAvailabilityAsync(Guid matchId, IReadOnlyList<UpdateAvailabilityItemViewModel> players, CancellationToken cancellationToken = default)
        {
            var fixture = await GetAssignedFixtureAsync(matchId, cancellationToken);
            if (fixture is null)
            {
                return new List<MatchAvailabilityItemViewModel>();
            }

            var roster = await GetTeamRosterAsync(fixture.TeamId, cancellationToken);
            var allowedIds = roster.Select(r => r.PlayerId).ToHashSet();
            var rows = await _db.Availabilities
                .Where(a => a.FixtureId == matchId && allowedIds.Contains(a.PlayerId))
                .ToListAsync(cancellationToken);

            foreach (var update in players.Where(p => allowedIds.Contains(p.PlayerId)))
            {
                var parsed = ParseAvailabilityStatus(update.Status);
                var row = rows.FirstOrDefault(a => a.PlayerId == update.PlayerId);
                if (row is null)
                {
                    row = new Availability
                    {
                        Id = Guid.NewGuid(),
                        PlayerId = update.PlayerId,
                        FixtureId = fixture.Id,
                        TeamId = fixture.TeamId,
                        CreatedAt = DateTime.UtcNow,
                    };
                    _db.Availabilities.Add(row);
                    rows.Add(row);
                }

                row.Status = parsed;
                row.ResponseSource = "app";
                row.ResponseTimestamp = DateTime.UtcNow;
                row.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync(cancellationToken);
            return await GetMatchAvailabilityAsync(matchId, cancellationToken);
        }

        public async Task<IReadOnlyList<InjuryViewModel>> GetPlayerInjuriesAsync(Guid playerId, CancellationToken cancellationToken = default)
        {
            if (!await IsPlayerInCoachTeamsAsync(playerId, cancellationToken))
            {
                return new List<InjuryViewModel>();
            }

            return await _repository.Injury
                .FindByCondition(i => i.PlayerId == playerId)
                .OrderByDescending(i => i.OccurredAt)
                .Select(i => i.ToViewModel())
                .ToListAsync(cancellationToken);
        }

        public async Task<InjuryViewModel?> CreatePlayerInjuryAsync(CreateInjuryViewModel model, CancellationToken cancellationToken = default)
        {
            if (!await IsPlayerInCoachTeamsAsync(model.PlayerId, cancellationToken))
            {
                return null;
            }

            var now = DateTime.UtcNow;
            var injury = new Injury
            {
                Id = Guid.NewGuid(),
                PlayerId = model.PlayerId,
                InjuryType = model.InjuryType,
                BodyPart = model.BodyPart,
                Severity = model.Severity,
                OccurredAt = model.OccurredAt,
                EstimatedReturnDate = model.EstimatedReturnDate,
                Status = InjuryStatus.Active,
                MedicalNotes = model.MedicalNotes,
                TreatmentNotes = model.TreatmentNotes,
                ReportedBy = _currentUser.UserId,
                IsMatchInjury = model.IsMatchInjury,
                FixtureId = model.FixtureId,
                CreatedAt = now,
                UpdatedAt = now,
            };

            _db.Injuries.Add(injury);
            await _db.SaveChangesAsync(cancellationToken);
            return injury.ToViewModel();
        }

        public async Task<TacticalLayoutViewModel?> GetTacticalLayoutAsync(Guid matchId, CancellationToken cancellationToken = default)
        {
            var fixture = await GetAssignedFixtureAsync(matchId, cancellationToken);
            if (fixture is null)
            {
                return null;
            }

            var layout = await _db.TacticalLayouts.FirstOrDefaultAsync(t => t.MatchId == matchId, cancellationToken);
            if (layout is null)
            {
                return new TacticalLayoutViewModel
                {
                    MatchId = matchId,
                    Players = new List<TacticalLayoutItemViewModel>(),
                    BenchPlayerIds = new List<Guid>(),
                    Planner = new MatchdayPlannerViewModel(),
                };
            }

            var document = DeserializeTacticalLayout(layout.Data, matchId);
            return new TacticalLayoutViewModel
            {
                MatchId = matchId,
                FormationId = document.FormationId,
                BenchPlayerIds = document.BenchPlayerIds,
                Planner = document.Planner,
                Players = document.Players,
            };
        }

        public async Task<TacticalLayoutViewModel?> SaveTacticalLayoutAsync(SaveTacticalLayoutViewModel model, CancellationToken cancellationToken = default)
        {
            var fixture = await GetAssignedFixtureAsync(model.MatchId, cancellationToken);
            if (fixture is null)
            {
                return null;
            }

            var rosterIds = (await GetTeamRosterAsync(fixture.TeamId, cancellationToken)).Select(r => r.PlayerId).ToHashSet();
            var sanitized = model.Players.Where(p => rosterIds.Contains(p.PlayerId)).Take(11).ToList();
            var sanitizedBench = model.BenchPlayerIds
                .Where(rosterIds.Contains)
                .Except(sanitized.Select(p => p.PlayerId))
                .Take(5)
                .ToList();

            var payload = new TacticalLayoutDocument
            {
                MatchId = model.MatchId,
                FormationId = model.FormationId,
                BenchPlayerIds = sanitizedBench,
                Planner = model.Planner ?? new MatchdayPlannerViewModel(),
                Players = sanitized,
            };

            var row = await _db.TacticalLayouts.FirstOrDefaultAsync(t => t.MatchId == model.MatchId, cancellationToken);
            if (row is null)
            {
                row = new TacticalLayout
                {
                    Id = Guid.NewGuid(),
                    MatchId = model.MatchId,
                    CreatedAt = DateTime.UtcNow,
                };
                _db.TacticalLayouts.Add(row);
            }

            row.Data = JsonSerializer.Serialize(payload);
            row.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);

            return new TacticalLayoutViewModel
            {
                MatchId = model.MatchId,
                FormationId = payload.FormationId,
                BenchPlayerIds = payload.BenchPlayerIds,
                Planner = payload.Planner,
                Players = payload.Players,
            };
        }

        private static TacticalLayoutDocument DeserializeTacticalLayout(string rawJson, Guid matchId)
        {
            if (string.IsNullOrWhiteSpace(rawJson))
            {
                return new TacticalLayoutDocument { MatchId = matchId };
            }

            using var document = JsonDocument.Parse(rawJson);
            if (document.RootElement.ValueKind == JsonValueKind.Array)
            {
                return new TacticalLayoutDocument
                {
                    MatchId = matchId,
                    Players = JsonSerializer.Deserialize<List<TacticalLayoutItemViewModel>>(rawJson) ?? new List<TacticalLayoutItemViewModel>(),
                };
            }

            var payload = JsonSerializer.Deserialize<TacticalLayoutDocument>(rawJson) ?? new TacticalLayoutDocument();
            payload.MatchId = payload.MatchId == Guid.Empty ? matchId : payload.MatchId;
            payload.BenchPlayerIds ??= new List<Guid>();
            payload.Planner ??= new MatchdayPlannerViewModel();
            payload.Players ??= new List<TacticalLayoutItemViewModel>();
            return payload;
        }

        private sealed class TacticalLayoutDocument
        {
            public Guid MatchId { get; set; }
            public string? FormationId { get; set; }
            public List<Guid>? BenchPlayerIds { get; set; } = new();
            public MatchdayPlannerViewModel? Planner { get; set; } = new();
            public List<TacticalLayoutItemViewModel>? Players { get; set; } = new();
        }

        public async Task<ImportPlayersCsvResultViewModel?> ImportPlayersCsvAsync(Guid teamId, IFormFile file, CancellationToken cancellationToken = default)
        {
            var team = await _db.Teams.FirstOrDefaultAsync(t => t.Id == teamId && t.TenantId == _currentUser.TenantId, cancellationToken);
            if (team is null || !await _db.TeamCoaches.AnyAsync(tc => tc.TeamId == teamId && tc.CoachId == _currentUser.UserId, cancellationToken))
            {
                return null;
            }

            using var stream = file.OpenReadStream();
            using var reader = new StreamReader(stream);
            using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);
            var records = csv.GetRecords<ImportCsvRow>().ToList();

            var result = new ImportPlayersCsvResultViewModel();
            var now = DateTime.UtcNow;
            var newUsers = new List<User>();
            var newTeamPlayers = new List<TeamPlayer>();
            var seenIdNumbers = await _db.Users
                .Where(u => u.TenantId == _currentUser.TenantId && u.IdNumber != null)
                .Select(u => u.IdNumber!)
                .ToListAsync(cancellationToken);
            var seenSet = seenIdNumbers.ToHashSet(StringComparer.OrdinalIgnoreCase);

            foreach (var record in records)
            {
                if (string.IsNullOrWhiteSpace(record.Name))
                {
                    result.Errors.Add("Skipped row with empty Name.");
                    continue;
                }

                if (!string.IsNullOrWhiteSpace(record.IdNumber) && seenSet.Contains(record.IdNumber))
                {
                    result.DuplicateCount += 1;
                    continue;
                }

                var (firstName, lastName) = SplitName(record.Name);
                var user = new User
                {
                    Id = Guid.NewGuid(),
                    TenantId = _currentUser.TenantId,
                    Role = UserRole.Player,
                    FirstName = firstName,
                    LastName = lastName,
                    IdNumber = string.IsNullOrWhiteSpace(record.IdNumber) ? null : record.IdNumber.Trim(),
                    PreferredPosition = string.IsNullOrWhiteSpace(record.Position) ? null : record.Position.Trim(),
                    DateOfBirth = record.DateOfBirth?.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc),
                    IsActive = true,
                    UserName = $"player-{Guid.NewGuid():N}"[..18],
                    CreatedAt = now,
                    UpdatedAt = now,
                };

                newUsers.Add(user);
                newTeamPlayers.Add(new TeamPlayer
                {
                    TeamId = teamId,
                    PlayerId = user.Id,
                    Position = user.PreferredPosition,
                    IsActive = true,
                });

                if (!string.IsNullOrWhiteSpace(user.IdNumber))
                {
                    seenSet.Add(user.IdNumber);
                }
            }

            await _db.Users.AddRangeAsync(newUsers, cancellationToken);
            await _db.TeamPlayers.AddRangeAsync(newTeamPlayers, cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);

            result.ImportedCount = newUsers.Count;
            return result;
        }

        public async Task<AlertsResponseViewModel> GetAlertsAsync(CancellationToken cancellationToken = default)
        {
            await GenerateAlertsAsync(cancellationToken);

            var teamIds = GetCoachTeamIds();
            var playerIds = await _db.TeamPlayers
                .Where(tp => teamIds.Contains(tp.TeamId) && tp.IsActive)
                .Select(tp => tp.PlayerId)
                .Distinct()
                .ToListAsync(cancellationToken);

            var items = await _db.Alerts
                .Where(a => playerIds.Contains(a.PlayerId))
                .OrderByDescending(a => a.CreatedAt)
                .Take(20)
                .Select(a => new AlertViewModel
                {
                    Id = a.Id,
                    PlayerId = a.PlayerId,
                    MatchId = a.MatchId,
                    PlayerName = (a.Player.FirstName + " " + a.Player.LastName).Trim(),
                    Message = a.Message,
                    Severity = a.Severity,
                    IsRead = a.IsRead,
                    CreatedAt = a.CreatedAt
                })
                .ToListAsync(cancellationToken);

            return new AlertsResponseViewModel
            {
                UnreadCount = items.Count(x => !x.IsRead),
                Items = items,
            };
        }

        public async Task<bool> MarkAlertReadAsync(Guid alertId, CancellationToken cancellationToken = default)
        {
            var alert = await _db.Alerts.FirstOrDefaultAsync(a => a.Id == alertId, cancellationToken);
            if (alert is null)
            {
                return false;
            }

            alert.IsRead = true;
            alert.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
            return true;
        }

        private async Task GenerateAlertsAsync(CancellationToken cancellationToken)
        {
            var teamIds = GetCoachTeamIds();
            if (teamIds.Count == 0)
            {
                return;
            }

            var playerIds = await _db.TeamPlayers
                .Where(tp => teamIds.Contains(tp.TeamId) && tp.IsActive)
                .Select(tp => tp.PlayerId)
                .Distinct()
                .ToListAsync(cancellationToken);

            foreach (var playerId in playerIds)
            {
                var lastThreeRatings = await _db.Assessments
                    .Where(a => a.PlayerId == playerId && a.IsMatchAssessment && a.OverallRating.HasValue)
                    .OrderByDescending(a => a.AssessmentDate)
                    .Take(3)
                    .Select(a => a.OverallRating!.Value)
                    .ToListAsync(cancellationToken);
                if (lastThreeRatings.Count == 3 && lastThreeRatings.All(r => r <= 6))
                {
                    await EnsureAlertAsync(playerId, null, "Performance dip: below 6.0 for 3 matches in a row.", "warning", cancellationToken);
                }

                var lastFourAttendance = await _db.TrainingAttendances
                    .Where(t => t.PlayerId == playerId)
                    .OrderByDescending(t => t.SessionDate)
                    .Take(4)
                    .ToListAsync(cancellationToken);
                if (lastFourAttendance.Count == 4 && lastFourAttendance.All(t => !t.IsPresent))
                {
                    await EnsureAlertAsync(playerId, null, "Attendance concern: missed 4 training sessions in a row.", "error", cancellationToken);
                }

                var lastFiveMatches = await _db.Assessments
                    .Where(a => a.PlayerId == playerId && a.IsMatchAssessment)
                    .OrderByDescending(a => a.AssessmentDate)
                    .Take(5)
                    .Select(a => new { a.FixtureId, a.Metrics })
                    .ToListAsync(cancellationToken);
                if (lastFiveMatches.Count == 5 && lastFiveMatches.All(m => ReadMetricInt(m.Metrics, "goals") == 0 && !IsKind(ReadMetricString(m.Metrics, "kind"), "Goal")))
                {
                    await EnsureAlertAsync(playerId, lastFiveMatches.First().FixtureId, "Goal drought: no goals in 5 matches.", "info", cancellationToken);
                }
            }
        }

        private async Task EnsureAlertAsync(Guid playerId, Guid? matchId, string message, string severity, CancellationToken cancellationToken)
        {
            var exists = await _db.Alerts.AnyAsync(a => a.PlayerId == playerId && a.Message == message && !a.IsRead, cancellationToken);
            if (exists)
            {
                return;
            }

            _db.Alerts.Add(new Alert
            {
                Id = Guid.NewGuid(),
                PlayerId = playerId,
                MatchId = matchId,
                Message = message,
                Severity = severity,
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            });
            await _db.SaveChangesAsync(cancellationToken);
        }

        private async Task<Fixture?> GetAssignedFixtureAsync(Guid matchId, CancellationToken cancellationToken)
        {
            var fixture = await _db.Fixtures.FirstOrDefaultAsync(f => f.Id == matchId, cancellationToken);
            if (fixture is null)
            {
                return null;
            }

            var assigned = await _db.TeamCoaches.AnyAsync(tc => tc.TeamId == fixture.TeamId && tc.CoachId == _currentUser.UserId, cancellationToken);
            return assigned ? fixture : null;
        }

        private async Task<List<(Guid PlayerId, string PlayerName, string? Position)>> GetTeamRosterAsync(Guid teamId, CancellationToken cancellationToken)
        {
            return await _db.TeamPlayers
                .Where(tp => tp.TeamId == teamId && tp.IsActive)
                .Select(tp => new ValueTuple<Guid, string, string?>(tp.PlayerId, (tp.Player.FirstName + " " + tp.Player.LastName).Trim(), tp.Position))
                .ToListAsync(cancellationToken);
        }

        private List<Guid> GetCoachTeamIds()
        {
            return _repository.TeamCoach
                .FindByCondition(tc => tc.CoachId == _currentUser.UserId && tc.Team.TenantId == _currentUser.TenantId)
                .Select(tc => tc.TeamId)
                .Distinct()
                .ToList();
        }

        private async Task<bool> IsPlayerInCoachTeamsAsync(Guid playerId, CancellationToken cancellationToken)
        {
            var teamIds = GetCoachTeamIds();
            return await _db.TeamPlayers.AnyAsync(tp => tp.PlayerId == playerId && teamIds.Contains(tp.TeamId), cancellationToken);
        }

        private static AvailabilityStatus ParseAvailabilityStatus(string status)
        {
            return Enum.TryParse<AvailabilityStatus>(status, true, out var parsed)
                ? parsed
                : AvailabilityStatus.NoResponse;
        }

        private static string? ReadMetricString(Dictionary<string, object>? metrics, string key)
        {
            if (metrics is null) return null;
            foreach (var metric in metrics)
            {
                if (!string.Equals(metric.Key, key, StringComparison.OrdinalIgnoreCase)) continue;
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
            if (metrics is null) return 0;
            foreach (var metric in metrics)
            {
                if (!string.Equals(metric.Key, key, StringComparison.OrdinalIgnoreCase)) continue;
                return metric.Value switch
                {
                    JsonElement element when element.ValueKind == JsonValueKind.Number && element.TryGetInt32(out var value) => value,
                    JsonElement element when element.ValueKind == JsonValueKind.String && int.TryParse(element.GetString(), out var parsed) => parsed,
                    _ => int.TryParse(metric.Value?.ToString(), out var parsed) ? parsed : 0,
                };
            }
            return 0;
        }

        private static bool IsKind(string? value, string expected) => string.Equals(value, expected, StringComparison.OrdinalIgnoreCase);

        private static (string FirstName, string LastName) SplitName(string fullName)
        {
            var trimmed = (fullName ?? string.Empty).Trim();
            if (trimmed.Length == 0) return (string.Empty, string.Empty);
            var parts = trimmed.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            return parts.Length == 1 ? (parts[0], string.Empty) : (parts[0], parts[1]);
        }

        private sealed class ImportCsvRow
        {
            public string Name { get; set; } = string.Empty;
            public string? IdNumber { get; set; }
            public string? Position { get; set; }
            public DateOnly? DateOfBirth { get; set; }
        }
    }
}
