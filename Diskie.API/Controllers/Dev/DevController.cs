using Bogus;
using Diskie.API.Services.Coach;
using Diskie.API.Security;
using Diskie.DataAccess.Model.DbModels;
using Diskie.DataAccess.Model.Models.Common;
using Diskie.DataAccess.Model.Models.DbModels;
using Diskie.DataAccess.Model.Models.Enums;
using Diskie.DataAccess.Model.Models.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Diskie.API.Controllers.Dev
{
    [ApiController]
    [Produces("application/json")]
    [Authorize]
    [Route("api/dev")]
    public class DevController : ControllerBase
    {
        private const string SeedTag = "[SEED:DEMO]";
        private const string SeedEmailSuffix = "@seed.local";

        private readonly DiskiDbContext _db;
        private readonly ICurrentUserContext _currentUser;
        private readonly IMilestoneService _milestoneService;

        public DevController(DiskiDbContext db, ICurrentUserContext currentUser, IMilestoneService milestoneService)
        {
            _db = db;
            _currentUser = currentUser;
            _milestoneService = milestoneService;
        }

        [HttpPost("seed")]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ApiResponse<object>>> Seed(
            [FromQuery] Guid? clubId,
            CancellationToken cancellationToken)
        {
            var tenantId = clubId ?? (_currentUser.TenantId == Guid.Empty ? null : _currentUser.TenantId);
            if (!tenantId.HasValue)
            {
                return BadRequest(ApiResponse<object>.Fail("A ClubId (tenant) is required.", "400"));
            }

            var sportTemplateId = await _db.SportTemplates
                .Where(t => t.IsActive)
                .OrderBy(t => t.CreatedAt)
                .Select(t => (Guid?)t.Id)
                .FirstOrDefaultAsync(cancellationToken);
            if (!sportTemplateId.HasValue)
            {
                return BadRequest(ApiResponse<object>.Fail("No active sport template exists for seeding.", "400"));
            }

            var tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId.Value, cancellationToken);
            if (tenant is not null && !tenant.AssignedSportTemplateId.HasValue)
            {
                tenant.AssignedSportTemplateId = sportTemplateId.Value;
                tenant.UpdatedAt = DateTime.UtcNow;
            }

            var season = await _db.Seasons
                .Where(s => s.TenantId == tenantId.Value && s.SportTemplateId == sportTemplateId.Value && s.IsActive)
                .OrderByDescending(s => s.StartDate)
                .FirstOrDefaultAsync(cancellationToken);

            if (season is null)
            {
                var now = DateTime.UtcNow;
                season = new Season
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId.Value,
                    SportTemplateId = sportTemplateId.Value,
                    Name = $"{SeedTag} Season {now.Year}",
                    StartDate = DateOnly.FromDateTime(now.AddMonths(-2)),
                    EndDate = DateOnly.FromDateTime(now.AddMonths(3)),
                    IsActive = true,
                    CreatedAt = now,
                    UpdatedAt = now
                };
                _db.Seasons.Add(season);
            }

            var team = await _db.Teams
                .Where(t => t.TenantId == tenantId.Value && t.SeasonId == season.Id && t.IsActive)
                .OrderBy(t => t.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (team is null)
            {
                team = new Team
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId.Value,
                    SeasonId = season.Id,
                    SportTemplateId = season.SportTemplateId,
                    Name = "Cape Town Development XI",
                    AgeGroup = "U17",
                    GenderCategory = "Mixed",
                    Level = "Academy",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _db.Teams.Add(team);
            }

            if (_currentUser.UserId != Guid.Empty)
            {
                var hasCoachLink = await _db.TeamCoaches
                    .AnyAsync(tc => tc.TeamId == team.Id && tc.CoachId == _currentUser.UserId, cancellationToken);

                if (!hasCoachLink)
                {
                    _db.TeamCoaches.Add(new TeamCoach
                    {
                        TeamId = team.Id,
                        CoachId = _currentUser.UserId,
                        Role = "Head Coach",
                        IsPrimary = true
                    });
                }
            }

            var existingPlayers = await _db.TeamPlayers
                .Where(tp => tp.TeamId == team.Id)
                .Select(tp => tp.PlayerId)
                .ToListAsync(cancellationToken);

            var playersToCreate = Math.Max(0, 20 - existingPlayers.Count);
            var createdPlayers = new List<User>();

            var firstNames = new[]
            {
                "Sipho", "Thabo", "Lungelo", "Mandla", "Bongani", "Sibusiso", "Themba", "Ayanda", "Lethabo", "Aphiwe",
                "Naledi", "Nandi", "Zanele", "Boitumelo", "Nomsa", "Lerato", "Palesa", "Zinhle", "Anele", "Khethiwe"
            };
            var lastNames = new[]
            {
                "Dlamini", "Nkosi", "Mokoena", "Khumalo", "Ndlovu", "Mabena", "Zulu", "Mthembu", "Mahlangu", "Cele",
                "Maseko", "Sithole", "Motloung", "Naidoo", "Pillay", "Govender", "Jacobs", "Petersen", "Botha", "Molefe"
            };
            var positions = new[] { "GK", "RB", "CB", "LB", "CM", "RW", "LW", "ST" };

            var userFaker = new Faker<User>()
                .RuleFor(u => u.Id, _ => Guid.NewGuid())
                .RuleFor(u => u.TenantId, _ => tenantId.Value)
                .RuleFor(u => u.Role, _ => UserRole.Player)
                .RuleFor(u => u.FirstName, f => f.PickRandom(firstNames))
                .RuleFor(u => u.LastName, f => f.PickRandom(lastNames))
                .RuleFor(u => u.PreferredPosition, f => f.PickRandom(positions))
                .RuleFor(u => u.IsActive, _ => true)
                .RuleFor(u => u.CreatedAt, _ => DateTime.UtcNow)
                .RuleFor(u => u.UpdatedAt, _ => DateTime.UtcNow)
                .FinishWith((_f, u) =>
                {
                    var slug = $"{u.FirstName}.{u.LastName}.{Guid.NewGuid().ToString("N")[..6]}".ToLowerInvariant();
                    u.UserName = slug;
                    u.Email = $"{slug}@seed.local";
                });

            for (var i = 0; i < playersToCreate; i++)
            {
                var player = userFaker.Generate();
                createdPlayers.Add(player);
                _db.Users.Add(player);
                _db.TeamPlayers.Add(new TeamPlayer
                {
                    TeamId = team.Id,
                    PlayerId = player.Id,
                    Position = player.PreferredPosition,
                    JerseyNumber = 1 + i,
                    IsActive = true
                });
            }

            await _db.SaveChangesAsync(cancellationToken);

            var rosterPlayerIds = await _db.TeamPlayers
                .Where(tp => tp.TeamId == team.Id && tp.IsActive)
                .Select(tp => tp.PlayerId)
                .ToListAsync(cancellationToken);

            var seasonLabel = season.AcademicYear?.ToString() ?? season.Name;

            var existingSkillPlayers = await _db.PlayerSkills
                .Where(ps => rosterPlayerIds.Contains(ps.PlayerId) && ps.Season == seasonLabel)
                .Select(ps => ps.PlayerId)
                .Distinct()
                .ToListAsync(cancellationToken);

            var skillFaker = new Faker<PlayerSkill>()
                .RuleFor(x => x.Id, _ => Guid.NewGuid())
                .RuleFor(x => x.Attacking, f => f.Random.Int(4, 10))
                .RuleFor(x => x.Defending, f => f.Random.Int(4, 10))
                .RuleFor(x => x.Passing, f => f.Random.Int(4, 10))
                .RuleFor(x => x.Physicality, f => f.Random.Int(4, 10))
                .RuleFor(x => x.Composure, f => f.Random.Int(4, 10))
                .RuleFor(x => x.Season, _ => seasonLabel)
                .RuleFor(x => x.CreatedAt, _ => DateTime.UtcNow)
                .RuleFor(x => x.UpdatedAt, _ => DateTime.UtcNow);

            foreach (var playerId in rosterPlayerIds.Where(id => !existingSkillPlayers.Contains(id)))
            {
                var skill = skillFaker.Generate();
                skill.PlayerId = playerId;
                _db.PlayerSkills.Add(skill);
            }

            await _db.SaveChangesAsync(cancellationToken);

            var newFixtures = new List<Fixture>();
            for (var i = 0; i < 10; i++)
            {
                var dt = DateTime.UtcNow.Date.AddDays(-(i * 7));
                var fixture = new Fixture
                {
                    Id = Guid.NewGuid(),
                    TeamId = team.Id,
                    SeasonId = team.SeasonId,
                    FixtureDate = DateOnly.FromDateTime(dt),
                    StartTime = new TimeOnly(10, 0),
                    EndTime = new TimeOnly(11, 45),
                    Venue = new Faker().Address.City(),
                    Opponent = $"{new Faker().Address.City()} FC",
                    Type = FixtureType.Home,
                    Result = (new Faker()).PickRandom(FixtureResult.Win, FixtureResult.Draw, FixtureResult.Loss),
                    HomeScore = 0,
                    AwayScore = 0,
                    MatchReport = $"{SeedTag} Seeded development match.",
                    IsTraining = false,
                    IsCancelled = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                newFixtures.Add(fixture);
                _db.Fixtures.Add(fixture);
            }

            await _db.SaveChangesAsync(cancellationToken);

            var random = new Random();
            var assessments = new List<Assessment>();
            var attendances = new List<Attendance>();

            foreach (var fixture in newFixtures)
            {
                var playerSample = rosterPlayerIds
                    .OrderBy(_ => Guid.NewGuid())
                    .Take(Math.Min(11, rosterPlayerIds.Count))
                    .ToList();

                var homeScore = 0;
                var awayScore = 0;

                foreach (var playerId in playerSample)
                {
                    var rating = Math.Round(6.0 + random.NextDouble() * 3.0, 1);
                    var goals = random.Next(0, 3);
                    var assists = random.Next(0, 2);

                    homeScore += goals;

                    assessments.Add(new Assessment
                    {
                        Id = Guid.NewGuid(),
                        PlayerId = playerId,
                        CoachId = _currentUser.UserId == Guid.Empty ? playerId : _currentUser.UserId,
                        TeamId = team.Id,
                        SportTemplateId = team.SportTemplateId,
                        AssessmentDate = fixture.FixtureDate,
                        Metrics = new Dictionary<string, object>
                        {
                            ["rating"] = rating,
                            ["goals"] = goals,
                            ["assists"] = assists,
                            ["kind"] = goals > 0 ? "Goal" : (assists > 0 ? "Assist" : "")
                        },
                        FreeText = $"{SeedTag} Seeded match performance",
                        OverallRating = (int)Math.Round(rating, MidpointRounding.AwayFromZero),
                        IsMatchAssessment = true,
                        FixtureId = fixture.Id,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    });

                    attendances.Add(new Attendance
                    {
                        Id = Guid.NewGuid(),
                        TeamId = team.Id,
                        PlayerId = playerId,
                        FixtureId = fixture.Id,
                        SessionType = "match",
                        SessionDate = fixture.FixtureDate,
                        Status = AttendanceStatus.Present,
                        Notes = SeedTag,
                        RecordedBy = _currentUser.UserId == Guid.Empty ? null : _currentUser.UserId,
                        Synced = true,
                        SyncedAt = DateTime.UtcNow,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    });
                }

                awayScore = Math.Max(0, homeScore - random.Next(0, 3));
                fixture.HomeScore = homeScore;
                fixture.AwayScore = awayScore;
                fixture.Result = homeScore > awayScore ? FixtureResult.Win : homeScore == awayScore ? FixtureResult.Draw : FixtureResult.Loss;
                fixture.UpdatedAt = DateTime.UtcNow;

                foreach (var playerId in playerSample)
                {
                    var trainingCount = random.Next(1, 4);
                    for (var i = 1; i <= trainingCount; i++)
                    {
                        attendances.Add(new Attendance
                        {
                            Id = Guid.NewGuid(),
                            TeamId = team.Id,
                            PlayerId = playerId,
                            FixtureId = null,
                            SessionType = "training",
                            SessionDate = fixture.FixtureDate.AddDays(-i * 2),
                            Status = AttendanceStatus.Present,
                            Notes = SeedTag,
                            RecordedBy = _currentUser.UserId == Guid.Empty ? null : _currentUser.UserId,
                            Synced = true,
                            SyncedAt = DateTime.UtcNow,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        });
                    }
                }
            }

            var attendanceDateKeys = attendances
                .Select(a => a.SessionDate)
                .Distinct()
                .ToList();

            var existingAttendanceKeys = await _db.Attendances
                .Where(a => a.TeamId == team.Id
                    && rosterPlayerIds.Contains(a.PlayerId)
                    && attendanceDateKeys.Contains(a.SessionDate))
                .Select(a => new { a.TeamId, a.PlayerId, a.SessionDate })
                .ToListAsync(cancellationToken);

            var seenAttendanceKeys = new HashSet<string>(
                existingAttendanceKeys.Select(a => $"{a.TeamId}:{a.PlayerId}:{a.SessionDate:O}"));

            var uniqueAttendances = attendances
                .OrderByDescending(a => string.Equals(a.SessionType, "match", StringComparison.OrdinalIgnoreCase))
                .ThenByDescending(a => a.FixtureId.HasValue)
                .Where(a => seenAttendanceKeys.Add($"{a.TeamId}:{a.PlayerId}:{a.SessionDate:O}"))
                .ToList();

            _db.Assessments.AddRange(assessments);
            _db.Attendances.AddRange(uniqueAttendances);
            _db.TrainingAttendances.AddRange(uniqueAttendances
                .Where(a => string.Equals(a.SessionType, "training", StringComparison.OrdinalIgnoreCase))
                .GroupBy(a => new { a.PlayerId, a.SessionDate })
                .Select(group => new TrainingAttendance
                {
                    Id = Guid.NewGuid(),
                    PlayerId = group.Key.PlayerId,
                    SessionDate = group.Key.SessionDate,
                    IsPresent = group.Any(a => a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.Late),
                    IsLate = group.Any(a => a.Status == AttendanceStatus.Late),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }));

            var senderId = _currentUser.UserId != Guid.Empty
                ? _currentUser.UserId
                : rosterPlayerIds.FirstOrDefault();

            if (senderId != Guid.Empty)
            {
                var existingAnnouncements = await _db.Announcements
                    .CountAsync(a => a.TenantId == tenantId.Value, cancellationToken);

                if (existingAnnouncements < 3)
                {
                    var now = DateTime.UtcNow;
                    var announcementSeed = new[]
                    {
                        new Announcement
                        {
                            Id = Guid.NewGuid(),
                            TenantId = tenantId.Value,
                            TeamId = team.Id,
                            SenderId = senderId,
                            Title = "Weekly Training Focus",
                            Body = $"{SeedTag} This week we focus on transitions and defensive structure.",
                            Audience = AnnouncementAudience.Team,
                            Priority = AnnouncementPriority.Important,
                            Channel = MessageChannel.Push,
                            SentAt = now,
                            CreatedAt = now,
                            UpdatedAt = now,
                        },
                        new Announcement
                        {
                            Id = Guid.NewGuid(),
                            TenantId = tenantId.Value,
                            TeamId = team.Id,
                            SenderId = senderId,
                            Title = "Matchday Preparation",
                            Body = $"{SeedTag} Hydration and recovery protocols are mandatory 24h before kickoff.",
                            Audience = AnnouncementAudience.Team,
                            Priority = AnnouncementPriority.Normal,
                            Channel = MessageChannel.Push,
                            SentAt = now.AddMinutes(-45),
                            CreatedAt = now.AddMinutes(-45),
                            UpdatedAt = now.AddMinutes(-45),
                        },
                        new Announcement
                        {
                            Id = Guid.NewGuid(),
                            TenantId = tenantId.Value,
                            TeamId = team.Id,
                            SenderId = senderId,
                            Title = "Wellness Check",
                            Body = $"{SeedTag} Report any soreness before Thursday's session.",
                            Audience = AnnouncementAudience.Team,
                            Priority = AnnouncementPriority.Urgent,
                            Channel = MessageChannel.Push,
                            SentAt = now.AddHours(-2),
                            CreatedAt = now.AddHours(-2),
                            UpdatedAt = now.AddHours(-2),
                        },
                    };

                    _db.Announcements.AddRange(announcementSeed);
                }
            }

            var existingInjuries = await _db.Injuries
                .CountAsync(i => rosterPlayerIds.Contains(i.PlayerId), cancellationToken);

            if (existingInjuries == 0 && rosterPlayerIds.Count > 0)
            {
                var injuryPlayers = rosterPlayerIds
                    .OrderBy(_ => Guid.NewGuid())
                    .Take(Math.Min(3, rosterPlayerIds.Count))
                    .ToList();

                var injurySeed = new List<Injury>
                {
                    new Injury
                    {
                        Id = Guid.NewGuid(),
                        PlayerId = injuryPlayers[0],
                        InjuryType = "Hamstring Strain",
                        BodyPart = "Right Hamstring",
                        Severity = InjurySeverity.Moderate,
                        OccurredAt = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-6)),
                        EstimatedReturnDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(9)),
                        Status = InjuryStatus.Active,
                        MedicalNotes = "Managed load and mobility work.",
                        TreatmentNotes = $"{SeedTag} Daily physio and icing protocol.",
                        ReportedBy = senderId != Guid.Empty ? senderId : null,
                        IsMatchInjury = true,
                        FixtureId = newFixtures.FirstOrDefault()?.Id,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                    }
                };

                if (injuryPlayers.Count > 1)
                {
                    injurySeed.Add(new Injury
                    {
                        Id = Guid.NewGuid(),
                        PlayerId = injuryPlayers[1],
                        InjuryType = "Ankle Sprain",
                        BodyPart = "Left Ankle",
                        Severity = InjurySeverity.Mild,
                        OccurredAt = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-11)),
                        EstimatedReturnDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1)),
                        ActualReturnDate = DateOnly.FromDateTime(DateTime.UtcNow),
                        Status = InjuryStatus.Recovered,
                        MedicalNotes = "Cleared for full training.",
                        TreatmentNotes = $"{SeedTag} Strength and proprioception completed.",
                        ReportedBy = senderId != Guid.Empty ? senderId : null,
                        IsMatchInjury = false,
                        FixtureId = null,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                    });
                }

                if (injuryPlayers.Count > 2)
                {
                    injurySeed.Add(new Injury
                    {
                        Id = Guid.NewGuid(),
                        PlayerId = injuryPlayers[2],
                        InjuryType = "Knee Contusion",
                        BodyPart = "Right Knee",
                        Severity = InjurySeverity.Moderate,
                        OccurredAt = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-14)),
                        EstimatedReturnDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(3)),
                        Status = InjuryStatus.Recovering,
                        MedicalNotes = "Progressing well through rehab.",
                        TreatmentNotes = $"{SeedTag} Limited minutes in drills.",
                        ReportedBy = senderId != Guid.Empty ? senderId : null,
                        IsMatchInjury = false,
                        FixtureId = null,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                    });
                }

                _db.Injuries.AddRange(injurySeed);
            }
            await _db.SaveChangesAsync(cancellationToken);

            foreach (var assessment in assessments)
            {
                await _milestoneService.EvaluateAssessmentAsync(assessment, cancellationToken);
            }

            return Ok(ApiResponse<object>.Ok(new
            {
                ClubId = tenantId,
                TeamId = team.Id,
                PlayersCreated = createdPlayers.Count,
                MatchesCreated = newFixtures.Count,
                PerformancesCreated = assessments.Count
            }, "Seed data generated."));
        }

        [HttpPost("reset-seed")]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ApiResponse<object>>> ResetSeed(
            [FromQuery] Guid? clubId,
            CancellationToken cancellationToken)
        {
            var tenantId = clubId ?? (_currentUser.TenantId == Guid.Empty ? null : _currentUser.TenantId);
            if (!tenantId.HasValue)
            {
                return BadRequest(ApiResponse<object>.Fail("A ClubId (tenant) is required.", "400"));
            }

            var teamIds = await _db.Teams
                .Where(t => t.TenantId == tenantId.Value)
                .Select(t => t.Id)
                .ToListAsync(cancellationToken);

            var seededPlayerIds = await _db.Users
                .Where(u => u.TenantId == tenantId.Value
                    && u.Role == UserRole.Player
                    && u.Email != null
                    && EF.Functions.Like(u.Email, $"%{SeedEmailSuffix}"))
                .Select(u => u.Id)
                .ToListAsync(cancellationToken);

            var seededFixtureIds = await _db.Fixtures
                .Where(f => teamIds.Contains(f.TeamId)
                    && f.MatchReport != null
                    && (EF.Functions.Like(f.MatchReport, $"%{SeedTag}%")
                        || f.MatchReport == "Seeded development match."))
                .Select(f => f.Id)
                .ToListAsync(cancellationToken);

            var seededAttendanceKeys = await _db.Attendances
                .Where(a => teamIds.Contains(a.TeamId)
                    && a.Notes != null
                    && EF.Functions.Like(a.Notes, $"%{SeedTag}%"))
                .Select(a => new { a.PlayerId, a.SessionDate })
                .Distinct()
                .ToListAsync(cancellationToken);

            await using var transaction = await _db.Database.BeginTransactionAsync(cancellationToken);

            var trainingRows = await _db.TrainingAttendances
                .Where(t => seededPlayerIds.Contains(t.PlayerId)
                    || seededAttendanceKeys.Select(k => k.PlayerId).Contains(t.PlayerId))
                .ToListAsync(cancellationToken);

            if (seededAttendanceKeys.Count > 0)
            {
                var seedTrainingKeySet = seededAttendanceKeys
                    .Select(k => $"{k.PlayerId}:{k.SessionDate:O}")
                    .ToHashSet(StringComparer.Ordinal);

                trainingRows = trainingRows
                    .Where(t => seedTrainingKeySet.Contains($"{t.PlayerId}:{t.SessionDate:O}") || seededPlayerIds.Contains(t.PlayerId))
                    .ToList();
            }

            var attendanceRows = await _db.Attendances
                .Where(a => teamIds.Contains(a.TeamId)
                    && ((a.Notes != null && EF.Functions.Like(a.Notes, $"%{SeedTag}%"))
                        || (a.FixtureId.HasValue && seededFixtureIds.Contains(a.FixtureId.Value))
                        || seededPlayerIds.Contains(a.PlayerId)))
                .ToListAsync(cancellationToken);

            var assessmentRows = await _db.Assessments
                .Where(a => teamIds.Contains(a.TeamId)
                    && ((a.FreeText != null && (EF.Functions.Like(a.FreeText, $"%{SeedTag}%") || a.FreeText == "Seeded match performance"))
                        || (a.FixtureId.HasValue && seededFixtureIds.Contains(a.FixtureId.Value))
                        || seededPlayerIds.Contains(a.PlayerId)))
                .ToListAsync(cancellationToken);

            var injuryRows = await _db.Injuries
                .Where(i => seededPlayerIds.Contains(i.PlayerId)
                    || (i.FixtureId.HasValue && seededFixtureIds.Contains(i.FixtureId.Value))
                    || (i.TreatmentNotes != null && EF.Functions.Like(i.TreatmentNotes, $"%{SeedTag}%")))
                .ToListAsync(cancellationToken);

            var announcementRows = await _db.Announcements
                .Where(a => a.TenantId == tenantId.Value
                    && (a.Body != null && EF.Functions.Like(a.Body, $"%{SeedTag}%")))
                .ToListAsync(cancellationToken);

            var fixtureRows = await _db.Fixtures
                .Where(f => seededFixtureIds.Contains(f.Id))
                .ToListAsync(cancellationToken);

            var playerSkillRows = await _db.PlayerSkills
                .Where(ps => seededPlayerIds.Contains(ps.PlayerId))
                .ToListAsync(cancellationToken);

            var teamPlayerRows = await _db.TeamPlayers
                .Where(tp => teamIds.Contains(tp.TeamId) && seededPlayerIds.Contains(tp.PlayerId))
                .ToListAsync(cancellationToken);

            var userRows = await _db.Users
                .Where(u => seededPlayerIds.Contains(u.Id))
                .ToListAsync(cancellationToken);

            if (trainingRows.Count > 0) _db.TrainingAttendances.RemoveRange(trainingRows);
            if (attendanceRows.Count > 0) _db.Attendances.RemoveRange(attendanceRows);
            if (assessmentRows.Count > 0) _db.Assessments.RemoveRange(assessmentRows);
            if (injuryRows.Count > 0) _db.Injuries.RemoveRange(injuryRows);
            if (announcementRows.Count > 0) _db.Announcements.RemoveRange(announcementRows);
            if (fixtureRows.Count > 0) _db.Fixtures.RemoveRange(fixtureRows);
            if (playerSkillRows.Count > 0) _db.PlayerSkills.RemoveRange(playerSkillRows);
            if (teamPlayerRows.Count > 0) _db.TeamPlayers.RemoveRange(teamPlayerRows);
            if (userRows.Count > 0) _db.Users.RemoveRange(userRows);

            await _db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return Ok(ApiResponse<object>.Ok(new
            {
                ClubId = tenantId,
                FixturesDeleted = fixtureRows.Count,
                AssessmentsDeleted = assessmentRows.Count,
                AttendancesDeleted = attendanceRows.Count,
                TrainingAttendancesDeleted = trainingRows.Count,
                AnnouncementsDeleted = announcementRows.Count,
                InjuriesDeleted = injuryRows.Count,
                SeedPlayersDeleted = userRows.Count
            }, "Seed data reset completed."));
        }
    }
}
