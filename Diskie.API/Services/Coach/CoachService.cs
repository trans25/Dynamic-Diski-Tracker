using Diskie.API.Mapping;
using Diskie.API.Security;
using Diskie.DataAccess.Contracts;
using Diskie.DataAccess.Model.DbModels;
using Diskie.DataAccess.Model.Models.DbModels;
using Diskie.DataAccess.Model.Models.Enums;
using Diskie.DataAccess.Model.Models.ViewModels;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Text.Json;

namespace Diskie.API.Services.Coach
{
    public class CoachService : ICoachService
    {
        private readonly IRepositoryWrapper _repository;
        private readonly ICurrentUserContext _currentUser;
        private readonly UserManager<User> _userManager;
        private readonly IMilestoneService _milestoneService;

        public CoachService(
            IRepositoryWrapper repository,
            ICurrentUserContext currentUser,
            UserManager<User> userManager,
            IMilestoneService milestoneService)
        {
            _repository = repository;
            _currentUser = currentUser;
            _userManager = userManager;
            _milestoneService = milestoneService;
        }

        public async Task<CoachDashboardViewModel> GetDashboardAsync(CancellationToken cancellationToken = default)
        {
            var teams = await GetMyTeamsAsync(cancellationToken);
            var teamIds = teams.Select(t => t.Id).ToList();

            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            var upcomingFixtures = _repository.Fixture
                .FindByCondition(f => teamIds.Contains(f.TeamId) && f.FixtureDate >= today && !f.IsCancelled)
                .OrderBy(f => f.FixtureDate)
                .ThenBy(f => f.StartTime)
                .Take(10)
                .Select(f => f.ToViewModel())
                .ToList();

            var playerIds = _repository.TeamPlayer
                .FindByCondition(tp => teamIds.Contains(tp.TeamId) && tp.IsActive)
                .Select(tp => tp.PlayerId)
                .Distinct()
                .ToList();

            var activeInjuryCount = _repository.Injury
                .FindByCondition(i => playerIds.Contains(i.PlayerId) && i.Status == InjuryStatus.Active)
                .Count();

            var recentAnnouncements = _repository.Announcement
                .FindByCondition(a => a.TenantId == _currentUser.TenantId)
                .OrderByDescending(a => a.CreatedAt)
                .Take(5)
                .Select(a => a.ToViewModel())
                .ToList();

            SportTemplateViewModel? assignedSportTemplate = null;
            if (_currentUser.TenantId != Guid.Empty)
            {
                assignedSportTemplate = _repository.Tenant
                    .FindByCondition(t => t.Id == _currentUser.TenantId)
                    .Select(t => t.AssignedSportTemplate)
                    .Where(t => t != null)
                    .Select(t => t!.ToViewModel())
                    .FirstOrDefault();
            }

            return new CoachDashboardViewModel
            {
                TeamCount = teams.Count,
                PlayerCount = playerIds.Count,
                UpcomingFixtureCount = upcomingFixtures.Count,
                ActiveInjuryCount = activeInjuryCount,
                AssignedSportTemplate = assignedSportTemplate,
                Teams = teams,
                UpcomingFixtures = upcomingFixtures,
                RecentAnnouncements = recentAnnouncements
            };
        }

        public Task<IReadOnlyList<CoachTeamViewModel>> GetMyTeamsAsync(CancellationToken cancellationToken = default)
        {
            var tenantId = _currentUser.TenantId;
            var coachId = _currentUser.UserId;

            IReadOnlyList<CoachTeamViewModel> teams = _repository.TeamCoach
                .FindByCondition(tc => tc.CoachId == coachId && tc.Team.TenantId == tenantId)
                .Select(tc => new CoachTeamViewModel
                {
                    Id = tc.Team.Id,
                    TenantId = tc.Team.TenantId,
                    SeasonId = tc.Team.SeasonId,
                    SportTemplateId = tc.Team.SportTemplateId,
                    Name = tc.Team.Name,
                    AgeGroup = tc.Team.AgeGroup,
                    GenderCategory = tc.Team.GenderCategory,
                    Level = tc.Team.Level,
                    CoachRole = tc.Role,
                    IsPrimaryCoach = tc.IsPrimary,
                    IsActive = tc.Team.IsActive,
                    PlayerCount = tc.Team.TeamPlayers.Count(tp => tp.IsActive)
                })
                .ToList();

            return Task.FromResult(teams);
        }

        public Task<IReadOnlyList<SportTemplateViewModel>> GetSportTemplatesAsync(CancellationToken cancellationToken = default)
        {
            IReadOnlyList<SportTemplateViewModel> templates = _repository.SportTemplate
                .FindByCondition(t => t.IsActive)
                .OrderBy(t => t.DisplayName)
                .Select(t => t.ToViewModel())
                .ToList();

            return Task.FromResult(templates);
        }

        public async Task<CoachTeamMutationResult> CreateTeamAsync(CreateCoachTeamViewModel model, CancellationToken cancellationToken = default)
        {
            var tenantId = _currentUser.TenantId;
            var coachId = _currentUser.UserId;

            var template = _repository.SportTemplate
                .FindByCondition(t => t.Id == model.SportTemplateId && t.IsActive)
                .FirstOrDefault();
            if (template is null)
            {
                return CoachTeamMutationResult.NotFound();
            }

            var now = DateTime.UtcNow;

            // Resolve the season: honour an explicit one validated against the tenant
            // and template, otherwise reuse an active matching season or create one.
            Season? season = null;
            if (model.SeasonId.HasValue)
            {
                season = _repository.Season
                    .FindByCondition(s => s.Id == model.SeasonId.Value
                        && s.TenantId == tenantId
                        && s.SportTemplateId == template.Id)
                    .FirstOrDefault();
                if (season is null)
                {
                    return CoachTeamMutationResult.NotFound();
                }
            }
            else
            {
                season = _repository.Season
                    .FindByCondition(s => s.TenantId == tenantId
                        && s.SportTemplateId == template.Id
                        && s.IsActive)
                    .OrderByDescending(s => s.StartDate)
                    .FirstOrDefault();

                if (season is null)
                {
                    var weeks = template.DefaultSeasonWeeks is > 0 ? template.DefaultSeasonWeeks!.Value : 26;
                    season = new Season
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        SportTemplateId = template.Id,
                        Name = $"{template.DisplayName} Season {now.Year}",
                        StartDate = DateOnly.FromDateTime(now),
                        EndDate = DateOnly.FromDateTime(now.AddDays(weeks * 7)),
                        IsActive = true,
                        CreatedAt = now,
                        UpdatedAt = now
                    };

                    _repository.Season.Create(season);
                }
            }

            var trimmedName = model.Name?.Trim() ?? string.Empty;
            var nameExists = _repository.Team
                .FindByCondition(t => t.SeasonId == season.Id
                    && t.TenantId == tenantId
                    && t.Name.ToLower() == trimmedName.ToLower())
                .Any();
            if (nameExists)
            {
                return CoachTeamMutationResult.DuplicateName();
            }

            var team = new Team
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                SeasonId = season.Id,
                SportTemplateId = template.Id,
                Name = trimmedName,
                AgeGroup = model.AgeGroup,
                GenderCategory = model.GenderCategory,
                Level = model.Level,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now
            };

            _repository.Team.Create(team);

            _repository.TeamCoach.Create(new TeamCoach
            {
                TeamId = team.Id,
                CoachId = coachId,
                Role = "Head Coach",
                IsPrimary = true
            });

            await _repository.SaveAsync(cancellationToken);

            return CoachTeamMutationResult.Succeeded(new CoachTeamViewModel
            {
                Id = team.Id,
                TenantId = team.TenantId,
                SeasonId = team.SeasonId,
                SportTemplateId = team.SportTemplateId,
                Name = team.Name,
                AgeGroup = team.AgeGroup,
                GenderCategory = team.GenderCategory,
                Level = team.Level,
                CoachRole = "Head Coach",
                IsPrimaryCoach = true,
                IsActive = true,
                PlayerCount = 0
            });
        }

        public async Task<CoachTeamMutationResult> UpdateTeamAsync(UpdateCoachTeamViewModel model, CancellationToken cancellationToken = default)
        {
            if (!IsCoachAssignedToTeam(model.Id))
            {
                return CoachTeamMutationResult.NotFound();
            }

            var tenantId = _currentUser.TenantId;
            var team = _repository.Team
                .FindByCondition(t => t.Id == model.Id && t.TenantId == tenantId, trackChanges: true)
                .FirstOrDefault();
            if (team is null)
            {
                return CoachTeamMutationResult.NotFound();
            }

            var trimmedName = model.Name?.Trim() ?? string.Empty;
            var nameExists = _repository.Team
                .FindByCondition(t => t.SeasonId == team.SeasonId
                    && t.TenantId == tenantId
                    && t.Id != team.Id
                    && t.Name.ToLower() == trimmedName.ToLower())
                .Any();
            if (nameExists)
            {
                return CoachTeamMutationResult.DuplicateName();
            }

            team.Name = trimmedName;
            team.AgeGroup = model.AgeGroup;
            team.GenderCategory = model.GenderCategory;
            team.Level = model.Level;
            team.IsActive = model.IsActive;
            team.UpdatedAt = DateTime.UtcNow;

            _repository.Team.Update(team);
            await _repository.SaveAsync(cancellationToken);

            var coachId = _currentUser.UserId;
            var membership = _repository.TeamCoach
                .FindByCondition(tc => tc.TeamId == team.Id && tc.CoachId == coachId)
                .FirstOrDefault();

            return CoachTeamMutationResult.Succeeded(new CoachTeamViewModel
            {
                Id = team.Id,
                TenantId = team.TenantId,
                SeasonId = team.SeasonId,
                SportTemplateId = team.SportTemplateId,
                Name = team.Name,
                AgeGroup = team.AgeGroup,
                GenderCategory = team.GenderCategory,
                Level = team.Level,
                CoachRole = membership?.Role,
                IsPrimaryCoach = membership?.IsPrimary ?? false,
                IsActive = team.IsActive,
                PlayerCount = _repository.TeamPlayer
                    .FindByCondition(tp => tp.TeamId == team.Id && tp.IsActive)
                    .Count()
            });
        }

        public async Task<CoachTeamDeleteResult> DeleteTeamAsync(Guid teamId, CancellationToken cancellationToken = default)
        {
            if (!IsCoachAssignedToTeam(teamId))
            {
                return CoachTeamDeleteResult.NotFound;
            }

            var tenantId = _currentUser.TenantId;
            var team = _repository.Team
                .FindByCondition(t => t.Id == teamId && t.TenantId == tenantId, trackChanges: true)
                .FirstOrDefault();
            if (team is null)
            {
                return CoachTeamDeleteResult.NotFound;
            }

            var hasPlayers = _repository.TeamPlayer
                .FindByCondition(tp => tp.TeamId == teamId)
                .Any();
            var hasFixtures = _repository.Fixture
                .FindByCondition(f => f.TeamId == teamId)
                .Any();

            if (hasPlayers || hasFixtures)
            {
                return CoachTeamDeleteResult.HasDependents;
            }

            var coachLinks = _repository.TeamCoach
                .FindByCondition(tc => tc.TeamId == teamId, trackChanges: true)
                .ToList();
            foreach (var link in coachLinks)
            {
                _repository.TeamCoach.Delete(link);
            }

            _repository.Team.Delete(team);
            await _repository.SaveAsync(cancellationToken);
            return CoachTeamDeleteResult.Deleted;
        }

        public Task<IReadOnlyList<RosterPlayerViewModel>?> GetRosterAsync(Guid teamId, CancellationToken cancellationToken = default)
        {
            if (!IsCoachAssignedToTeam(teamId))
            {
                return Task.FromResult<IReadOnlyList<RosterPlayerViewModel>?>(null);
            }

            IReadOnlyList<RosterPlayerViewModel> roster = _repository.TeamPlayer
                .FindByCondition(tp => tp.TeamId == teamId)
                .Select(tp => new RosterPlayerViewModel
                {
                    PlayerId = tp.PlayerId,
                    TeamId = tp.TeamId,
                    FirstName = tp.Player.FirstName,
                    LastName = tp.Player.LastName,
                    Email = tp.Player.Email,
                    Phone = tp.Player.Phone,
                    ProfilePhotoUrl = tp.Player.ProfilePhotoUrl,
                    JerseyNumber = tp.JerseyNumber,
                    Position = tp.Position,
                    TeamRole = tp.Role,
                    IsActive = tp.IsActive,
                    HasActiveInjury = tp.Player.Injuries.Any(i => i.Status == InjuryStatus.Active)
                })
                .ToList();

            return Task.FromResult<IReadOnlyList<RosterPlayerViewModel>?>(roster);
        }

        public async Task<RosterPlayerViewModel?> AddPlayerAsync(Guid teamId, CreateRosterPlayerViewModel model, CancellationToken cancellationToken = default)
        {
            if (!IsCoachAssignedToTeam(teamId))
            {
                return null;
            }

            var (firstName, lastName) = SplitName(model.FullName);
            var player = await CreatePlayerUserAsync(firstName, lastName, model.Position, model.JerseyNumber, model.DateOfBirth);
            if (player is null)
            {
                return null;
            }

            _repository.TeamPlayer.Create(new TeamPlayer
            {
                TeamId = teamId,
                PlayerId = player.Id,
                Position = model.Position,
                JerseyNumber = model.JerseyNumber,
                IsActive = true
            });

            await LinkGuardianIfProvidedAsync(player.Id, model.GuardianName, model.GuardianEmail, model.GuardianPhone, true);

            await _repository.SaveAsync(cancellationToken);

            return new RosterPlayerViewModel
            {
                PlayerId = player.Id,
                TeamId = teamId,
                FirstName = player.FirstName,
                LastName = player.LastName,
                Email = player.Email,
                Phone = player.Phone,
                ProfilePhotoUrl = player.ProfilePhotoUrl,
                JerseyNumber = model.JerseyNumber,
                Position = model.Position,
                TeamRole = null,
                IsActive = true,
                HasActiveInjury = false
            };
        }

        public async Task<RosterPlayerViewModel?> UpdatePlayerAsync(Guid teamId, Guid playerId, UpdateRosterPlayerViewModel model, CancellationToken cancellationToken = default)
        {
            if (!IsCoachAssignedToTeam(teamId))
            {
                return null;
            }

            var membership = _repository.TeamPlayer
                .FindByCondition(tp => tp.TeamId == teamId && tp.PlayerId == playerId, trackChanges: true)
                .FirstOrDefault();
            if (membership is null)
            {
                return null;
            }

            var player = await _repository.User.GetByIdAsync(playerId, cancellationToken);
            if (player is null)
            {
                return null;
            }

            var (firstName, lastName) = SplitName(model.FullName);
            player.FirstName = firstName;
            player.LastName = lastName;
            player.PreferredPosition = model.Position;
            player.JerseyNumber = model.JerseyNumber;
            player.UpdatedAt = DateTime.UtcNow;
            _repository.User.Update(player);

            membership.Position = model.Position;
            membership.JerseyNumber = model.JerseyNumber;
            membership.Role = model.TeamRole;
            membership.IsActive = model.IsActive;
            _repository.TeamPlayer.Update(membership);

            await _repository.SaveAsync(cancellationToken);

            return new RosterPlayerViewModel
            {
                PlayerId = player.Id,
                TeamId = teamId,
                FirstName = player.FirstName,
                LastName = player.LastName,
                Email = player.Email,
                Phone = player.Phone,
                ProfilePhotoUrl = player.ProfilePhotoUrl,
                JerseyNumber = membership.JerseyNumber,
                Position = membership.Position,
                TeamRole = membership.Role,
                IsActive = membership.IsActive,
                HasActiveInjury = _repository.Injury
                    .FindByCondition(i => i.PlayerId == player.Id && i.Status == InjuryStatus.Active)
                    .Any()
            };
        }

        public async Task<bool> RemovePlayerAsync(Guid teamId, Guid playerId, CancellationToken cancellationToken = default)
        {
            if (!IsCoachAssignedToTeam(teamId))
            {
                return false;
            }

            var membership = _repository.TeamPlayer
                .FindByCondition(tp => tp.TeamId == teamId && tp.PlayerId == playerId, trackChanges: true)
                .FirstOrDefault();
            if (membership is null)
            {
                return false;
            }

            _repository.TeamPlayer.Delete(membership);
            await _repository.SaveAsync(cancellationToken);
            return true;
        }

        public async Task<ImportPlayersResultViewModel?> ImportPlayersAsync(Guid teamId, ImportPlayersViewModel model, CancellationToken cancellationToken = default)
        {
            if (!IsCoachAssignedToTeam(teamId))
            {
                return null;
            }

            var created = new List<RosterPlayerViewModel>();
            var errors = new List<string>();

            for (var index = 0; index < model.Players.Count; index++)
            {
                var row = model.Players[index];
                if (string.IsNullOrWhiteSpace(row.FullName))
                {
                    errors.Add($"Row {index + 1}: Full name is required.");
                    continue;
                }

                var (firstName, lastName) = SplitName(row.FullName);
                var player = await CreatePlayerUserAsync(firstName, lastName, row.Position, row.JerseyNumber, row.DateOfBirth);
                if (player is null)
                {
                    errors.Add($"Row {index + 1} ({row.FullName}): Failed to create player account.");
                    continue;
                }

                _repository.TeamPlayer.Create(new TeamPlayer
                {
                    TeamId = teamId,
                    PlayerId = player.Id,
                    Position = row.Position,
                    JerseyNumber = row.JerseyNumber,
                    IsActive = true
                });

                await LinkGuardianIfProvidedAsync(player.Id, row.GuardianName, row.GuardianEmail, row.GuardianPhone, true);

                created.Add(new RosterPlayerViewModel
                {
                    PlayerId = player.Id,
                    TeamId = teamId,
                    FirstName = player.FirstName,
                    LastName = player.LastName,
                    Email = player.Email,
                    Phone = player.Phone,
                    JerseyNumber = row.JerseyNumber,
                    Position = row.Position,
                    IsActive = true,
                    HasActiveInjury = false
                });
            }

            await _repository.SaveAsync(cancellationToken);

            return new ImportPlayersResultViewModel
            {
                CreatedCount = created.Count,
                FailedCount = errors.Count,
                CreatedPlayers = created,
                Errors = errors
            };
        }

        public async Task<GuardianInviteResultViewModel?> InviteGuardianAsync(InviteGuardianViewModel model, CancellationToken cancellationToken = default)
        {
            if (!IsPlayerInCoachTeams(model.PlayerId))
            {
                return null;
            }

            var (firstName, lastName) = SplitName(model.GuardianName);
            var guardian = await _userManager.FindByEmailAsync(model.GuardianEmail);
            var accountCreated = false;

            if (guardian is null)
            {
                guardian = await CreateUserAsync(UserRole.Guardian, firstName, lastName, model.GuardianEmail, model.GuardianPhone);
                if (guardian is null)
                {
                    return null;
                }

                guardian.Relationship = model.Relationship;
                guardian.IsPrimaryGuardian = model.IsPrimary;
                accountCreated = true;
            }

            var alreadyLinked = _repository.PlayerGuardian
                .FindByCondition(pg => pg.PlayerId == model.PlayerId && pg.GuardianId == guardian.Id)
                .Any();

            if (!alreadyLinked)
            {
                _repository.PlayerGuardian.Create(new PlayerGuardian
                {
                    PlayerId = model.PlayerId,
                    GuardianId = guardian.Id,
                    IsPrimary = model.IsPrimary,
                    ConsentPriority = model.IsPrimary ? 1 : 2
                });

                await _repository.SaveAsync(cancellationToken);
            }

            return new GuardianInviteResultViewModel
            {
                GuardianId = guardian.Id,
                PlayerId = model.PlayerId,
                GuardianName = $"{guardian.FirstName} {guardian.LastName}".Trim(),
                GuardianEmail = guardian.Email ?? model.GuardianEmail,
                Relationship = model.Relationship,
                IsPrimary = model.IsPrimary,
                AccountCreated = accountCreated
            };
        }

        public Task<PlayerPerformanceViewModel?> GetPlayerPerformanceAsync(Guid playerId, CancellationToken cancellationToken = default)
        {
            if (!IsPlayerInCoachTeams(playerId))
            {
                return Task.FromResult<PlayerPerformanceViewModel?>(null);
            }

            var player = _repository.User
                .FindByCondition(u => u.Id == playerId)
                .FirstOrDefault();

            if (player is null)
            {
                return Task.FromResult<PlayerPerformanceViewModel?>(null);
            }

            var membership = _repository.TeamPlayer
                .FindByCondition(tp => tp.PlayerId == playerId)
                .OrderByDescending(tp => tp.IsActive)
                .FirstOrDefault();

            var attendances = _repository.Attendance
                .FindByCondition(a => a.PlayerId == playerId)
                .ToList();

            var totalSessions = attendances.Count;
            var attended = attendances.Count(a => a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.Late);

            var assessments = _repository.Assessment
                .FindByCondition(a => a.PlayerId == playerId)
                .OrderByDescending(a => a.AssessmentDate)
                .ToList();

            var ratings = assessments.Where(a => a.OverallRating.HasValue).Select(a => a.OverallRating!.Value).ToList();

            var injuries = _repository.Injury
                .FindByCondition(i => i.PlayerId == playerId)
                .OrderByDescending(i => i.OccurredAt)
                .ToList();

            var performance = new PlayerPerformanceViewModel
            {
                PlayerId = player.Id,
                FirstName = player.FirstName,
                LastName = player.LastName,
                ProfilePhotoUrl = player.ProfilePhotoUrl,
                JerseyNumber = membership?.JerseyNumber,
                Position = membership?.Position,
                TotalSessions = totalSessions,
                SessionsAttended = attended,
                AttendanceRate = totalSessions == 0 ? 0 : Math.Round((double)attended / totalSessions * 100, 1),
                AssessmentCount = assessments.Count,
                AverageRating = ratings.Count == 0 ? null : Math.Round(ratings.Average(), 2),
                HasActiveInjury = injuries.Any(i => i.Status == InjuryStatus.Active),
                InjuryCount = injuries.Count,
                RecentInjuries = injuries.Take(5).Select(i => i.ToViewModel()).ToList(),
                RecentAssessments = assessments.Take(5).Select(a => a.ToViewModel()).ToList()
            };

            return Task.FromResult<PlayerPerformanceViewModel?>(performance);
        }

        public Task<IReadOnlyList<FixtureViewModel>> GetUpcomingFixturesAsync(CancellationToken cancellationToken = default)
        {
            var teamIds = GetCoachTeamIds();
            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            IReadOnlyList<FixtureViewModel> fixtures = _repository.Fixture
                .FindByCondition(f => teamIds.Contains(f.TeamId) && f.FixtureDate >= today && !f.IsCancelled)
                .OrderBy(f => f.FixtureDate)
                .ThenBy(f => f.StartTime)
                .Select(f => f.ToViewModel())
                .ToList();

            return Task.FromResult(fixtures);
        }

        public Task<IReadOnlyList<FixtureViewModel>> GetMatchHistoryAsync(Guid? teamId, CancellationToken cancellationToken = default)
        {
            var teamIds = GetCoachTeamIds();
            if (teamId.HasValue)
            {
                if (!teamIds.Contains(teamId.Value))
                {
                    return Task.FromResult<IReadOnlyList<FixtureViewModel>>(new List<FixtureViewModel>());
                }

                teamIds = new List<Guid> { teamId.Value };
            }

            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            IReadOnlyList<FixtureViewModel> fixtures = _repository.Fixture
                .FindByCondition(f => teamIds.Contains(f.TeamId) && f.FixtureDate < today && !f.IsTraining)
                .OrderByDescending(f => f.FixtureDate)
                .ThenByDescending(f => f.StartTime)
                .Select(f => f.ToViewModel())
                .ToList();

            return Task.FromResult(fixtures);
        }

        public async Task<FixtureViewModel?> CreateMatchAsync(CreateFixtureViewModel model, CancellationToken cancellationToken = default)
        {
            if (!IsCoachAssignedToTeam(model.TeamId))
            {
                return null;
            }

            var now = DateTime.UtcNow;
            var fixture = new Fixture
            {
                Id = Guid.NewGuid(),
                TeamId = model.TeamId,
                SeasonId = model.SeasonId,
                FixtureDate = model.FixtureDate,
                StartTime = model.StartTime,
                EndTime = model.EndTime,
                Venue = model.Venue,
                Opponent = model.Opponent,
                Type = model.Type,
                IsTraining = model.IsTraining,
                IsCancelled = false,
                CreatedAt = now,
                UpdatedAt = now
            };

            _repository.Fixture.Create(fixture);
            await _repository.SaveAsync(cancellationToken);

            return fixture.ToViewModel();
        }

        public async Task<FixtureViewModel?> UpdateMatchAsync(UpdateFixtureViewModel model, CancellationToken cancellationToken = default)
        {
            var fixture = await _repository.Fixture.GetByIdAsync(model.Id, cancellationToken);
            if (fixture is null || !IsCoachAssignedToTeam(fixture.TeamId))
            {
                return null;
            }

            if (model.TeamId != fixture.TeamId && !IsCoachAssignedToTeam(model.TeamId))
            {
                return null;
            }

            fixture.TeamId = model.TeamId;
            fixture.SeasonId = model.SeasonId;
            fixture.FixtureDate = model.FixtureDate;
            fixture.StartTime = model.StartTime;
            fixture.EndTime = model.EndTime;
            fixture.Venue = model.Venue;
            fixture.Opponent = model.Opponent;
            fixture.Type = model.Type;
            fixture.Result = model.Result;
            fixture.HomeScore = model.HomeScore;
            fixture.AwayScore = model.AwayScore;
            fixture.MatchReport = model.MatchReport;
            fixture.IsTraining = model.IsTraining;
            fixture.IsCancelled = model.IsCancelled;
            fixture.UpdatedAt = DateTime.UtcNow;

            _repository.Fixture.Update(fixture);
            await _repository.SaveAsync(cancellationToken);

            return fixture.ToViewModel();
        }

        public async Task<FixtureViewModel?> CancelMatchAsync(Guid fixtureId, CancellationToken cancellationToken = default)
        {
            var fixture = await _repository.Fixture.GetByIdAsync(fixtureId, cancellationToken);
            if (fixture is null || !IsCoachAssignedToTeam(fixture.TeamId))
            {
                return null;
            }

            fixture.IsCancelled = true;
            fixture.UpdatedAt = DateTime.UtcNow;

            _repository.Fixture.Update(fixture);
            await _repository.SaveAsync(cancellationToken);

            return fixture.ToViewModel();
        }

        public async Task<bool> DeleteMatchAsync(Guid fixtureId, CancellationToken cancellationToken = default)
        {
            var fixture = await _repository.Fixture.GetByIdAsync(fixtureId, cancellationToken);
            if (fixture is null || !IsCoachAssignedToTeam(fixture.TeamId))
            {
                return false;
            }

            _repository.Fixture.Delete(fixture);
            await _repository.SaveAsync(cancellationToken);
            return true;
        }

        public Task<IReadOnlyList<InjuryViewModel>> GetTeamInjuriesAsync(Guid? teamId, CancellationToken cancellationToken = default)
        {
            var teamIds = GetCoachTeamIds();
            if (teamId.HasValue)
            {
                if (!teamIds.Contains(teamId.Value))
                {
                    return Task.FromResult<IReadOnlyList<InjuryViewModel>>(new List<InjuryViewModel>());
                }

                teamIds = new List<Guid> { teamId.Value };
            }

            var playerIds = _repository.TeamPlayer
                .FindByCondition(tp => teamIds.Contains(tp.TeamId))
                .Select(tp => tp.PlayerId)
                .Distinct()
                .ToList();

            IReadOnlyList<InjuryViewModel> injuries = _repository.Injury
                .FindByCondition(i => playerIds.Contains(i.PlayerId))
                .OrderByDescending(i => i.OccurredAt)
                .Select(i => i.ToViewModel())
                .ToList();

            return Task.FromResult(injuries);
        }

        public async Task<InjuryViewModel?> CreateInjuryAsync(CreateInjuryViewModel model, CancellationToken cancellationToken = default)
        {
            if (!IsPlayerInCoachTeams(model.PlayerId))
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
                UpdatedAt = now
            };

            _repository.Injury.Create(injury);
            await _repository.SaveAsync(cancellationToken);

            return injury.ToViewModel();
        }

        public async Task<InjuryViewModel?> UpdateInjuryAsync(UpdateInjuryViewModel model, CancellationToken cancellationToken = default)
        {
            var injury = await _repository.Injury.GetByIdAsync(model.Id, cancellationToken);
            if (injury is null || !IsPlayerInCoachTeams(injury.PlayerId))
            {
                return null;
            }

            injury.InjuryType = model.InjuryType;
            injury.BodyPart = model.BodyPart;
            injury.Severity = model.Severity;
            injury.EstimatedReturnDate = model.EstimatedReturnDate;
            injury.ActualReturnDate = model.ActualReturnDate;
            injury.Status = model.Status;
            injury.MedicalNotes = model.MedicalNotes;
            injury.TreatmentNotes = model.TreatmentNotes;
            injury.UpdatedAt = DateTime.UtcNow;

            _repository.Injury.Update(injury);
            await _repository.SaveAsync(cancellationToken);

            return injury.ToViewModel();
        }

        public async Task<bool> DeleteInjuryAsync(Guid injuryId, CancellationToken cancellationToken = default)
        {
            var injury = await _repository.Injury.GetByIdAsync(injuryId, cancellationToken);
            if (injury is null || !IsPlayerInCoachTeams(injury.PlayerId))
            {
                return false;
            }

            _repository.Injury.Delete(injury);
            await _repository.SaveAsync(cancellationToken);
            return true;
        }

        public Task<CoachAnalyticsViewModel> GetAnalyticsAsync(CancellationToken cancellationToken = default)
        {
            var teams = _repository.TeamCoach
                .FindByCondition(tc => tc.CoachId == _currentUser.UserId && tc.Team.TenantId == _currentUser.TenantId)
                .Select(tc => new { tc.TeamId, tc.Team.Name })
                .ToList();

            var teamIds = teams.Select(t => t.TeamId).ToList();
            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            var playedFixtures = _repository.Fixture
                .FindByCondition(f => teamIds.Contains(f.TeamId) && !f.IsTraining && f.FixtureDate < today)
                .Select(f => new { f.TeamId, f.Result })
                .ToList();

            var attendances = _repository.Attendance
                .FindByCondition(a => teamIds.Contains(a.TeamId))
                .Select(a => new { a.TeamId, a.Status })
                .ToList();

            var playerCounts = _repository.TeamPlayer
                .FindByCondition(tp => teamIds.Contains(tp.TeamId) && tp.IsActive)
                .Select(tp => new { tp.TeamId, tp.PlayerId })
                .ToList();

            var activeInjuryPlayerIds = _repository.Injury
                .FindByCondition(i => i.Status == InjuryStatus.Active)
                .Select(i => i.PlayerId)
                .ToList();

            var teamAnalytics = new List<TeamAnalyticsViewModel>();

            foreach (var team in teams)
            {
                var teamFixtures = playedFixtures.Where(f => f.TeamId == team.TeamId).ToList();
                var wins = teamFixtures.Count(f => f.Result == FixtureResult.Win);
                var losses = teamFixtures.Count(f => f.Result == FixtureResult.Loss);
                var draws = teamFixtures.Count(f => f.Result == FixtureResult.Draw);
                var played = teamFixtures.Count;

                var teamAttendance = attendances.Where(a => a.TeamId == team.TeamId).ToList();
                var attended = teamAttendance.Count(a => a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.Late);

                var teamPlayerIds = playerCounts.Where(p => p.TeamId == team.TeamId).Select(p => p.PlayerId).ToList();

                teamAnalytics.Add(new TeamAnalyticsViewModel
                {
                    TeamId = team.TeamId,
                    TeamName = team.Name,
                    PlayerCount = teamPlayerIds.Count,
                    Matches = played,
                    Wins = wins,
                    Losses = losses,
                    Draws = draws,
                    WinRate = played == 0 ? 0 : Math.Round((double)wins / played * 100, 1),
                    AttendanceRate = teamAttendance.Count == 0 ? 0 : Math.Round((double)attended / teamAttendance.Count * 100, 1),
                    ActiveInjuryCount = teamPlayerIds.Count(id => activeInjuryPlayerIds.Contains(id))
                });
            }

            var totalWins = teamAnalytics.Sum(t => t.Wins);
            var totalLosses = teamAnalytics.Sum(t => t.Losses);
            var totalDraws = teamAnalytics.Sum(t => t.Draws);
            var totalMatches = teamAnalytics.Sum(t => t.Matches);
            var totalAttendanceRecords = attendances.Count;
            var totalAttended = attendances.Count(a => a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.Late);
            var distinctPlayerIds = playerCounts.Select(p => p.PlayerId).Distinct().ToList();

            var analytics = new CoachAnalyticsViewModel
            {
                TeamCount = teams.Count,
                PlayerCount = distinctPlayerIds.Count,
                TotalMatches = totalMatches,
                Wins = totalWins,
                Losses = totalLosses,
                Draws = totalDraws,
                WinRate = totalMatches == 0 ? 0 : Math.Round((double)totalWins / totalMatches * 100, 1),
                OverallAttendanceRate = totalAttendanceRecords == 0 ? 0 : Math.Round((double)totalAttended / totalAttendanceRecords * 100, 1),
                ActiveInjuryCount = distinctPlayerIds.Count(id => activeInjuryPlayerIds.Contains(id)),
                TotalInjuryCount = _repository.Injury.FindByCondition(i => distinctPlayerIds.Contains(i.PlayerId)).Count(),
                Teams = teamAnalytics
            };

            return Task.FromResult(analytics);
        }

        public async Task<MetricInsightsViewModel> GetMetricInsightsAsync(CancellationToken cancellationToken = default)
        {
            var teamIds = GetCoachTeamIds();
            if (teamIds.Count == 0)
            {
                return new MetricInsightsViewModel();
            }

            var latestFixture = await _repository.Fixture
                .FindByCondition(f => teamIds.Contains(f.TeamId) && !f.IsTraining)
                .OrderByDescending(f => f.FixtureDate)
                .ThenByDescending(f => f.StartTime)
                .Select(f => new { f.TeamId, f.Opponent })
                .FirstOrDefaultAsync(cancellationToken);

            var referenceTeamId = latestFixture?.TeamId ?? teamIds[0];
            return await BuildMetricInsightsAsync(referenceTeamId, latestFixture?.Opponent, cancellationToken);
        }

        public async Task<LiveMatchViewModel?> GetLiveMatchAsync(Guid matchId, CancellationToken cancellationToken = default)
        {
            var fixture = await _repository.Fixture
                .FindByCondition(f => f.Id == matchId)
                .Select(f => new
                {
                    f.Id,
                    f.TeamId,
                    HomeTeamName = f.Team.Name,
                    f.Opponent,
                    f.HomeScore,
                    f.AwayScore,
                    f.FixtureDate,
                    f.StartTime,
                    f.EndTime
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (fixture is null || !IsCoachAssignedToTeam(fixture.TeamId))
            {
                return null;
            }

            var eventRows = await _repository.Assessment
                .FindByCondition(a => a.FixtureId == matchId && a.IsMatchAssessment)
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new
                {
                    a.Id,
                    a.FixtureId,
                    a.PlayerId,
                    a.Player.FirstName,
                    a.Player.LastName,
                    a.Metrics,
                    a.CreatedAt
                })
                .ToListAsync(cancellationToken);

            var events = eventRows
                .Select(e => new MatchEventViewModel
                {
                    Id = e.Id,
                    MatchId = e.FixtureId ?? matchId,
                    PlayerId = e.PlayerId,
                    PlayerName = BuildFullName(e.FirstName, e.LastName),
                    Kind = ReadMetricString(e.Metrics, "kind") ?? "Goal",
                    Side = ReadMetricString(e.Metrics, "side") ?? "home",
                    Minute = ReadMetricInt(e.Metrics, "minute"),
                    CreatedAt = e.CreatedAt
                })
                .ToList();

            var players = await _repository.TeamPlayer
                .FindByCondition(tp => tp.TeamId == fixture.TeamId && tp.IsActive)
                .Select(tp => new
                {
                    tp.PlayerId,
                    tp.Player.FirstName,
                    tp.Player.LastName
                })
                .ToListAsync(cancellationToken);

            var eventStats = events
                .GroupBy(e => e.PlayerId)
                .ToDictionary(
                    g => g.Key,
                    g => new
                    {
                        Goals = g.Count(e => string.Equals(e.Kind, "Goal", StringComparison.OrdinalIgnoreCase)),
                        Assists = g.Count(e => string.Equals(e.Kind, "Assist", StringComparison.OrdinalIgnoreCase)),
                        YellowCards = g.Count(e => string.Equals(e.Kind, "YellowCard", StringComparison.OrdinalIgnoreCase))
                    });

            var playerStats = players
                .Select(p =>
                {
                    eventStats.TryGetValue(p.PlayerId, out var stats);
                    var goals = stats?.Goals ?? 0;
                    var assists = stats?.Assists ?? 0;
                    var yellowCards = stats?.YellowCards ?? 0;
                    return new MatchPlayerStatsViewModel
                    {
                        PlayerId = p.PlayerId,
                        PlayerName = BuildFullName(p.FirstName, p.LastName),
                        Goals = goals,
                        Assists = assists,
                        YellowCards = yellowCards,
                        MetricScore = Math.Clamp(50 + (goals * 12) + (assists * 8) - (yellowCards * 5), 0, 100)
                    };
                })
                .OrderByDescending(p => p.MetricScore)
                .ToList();

            var computedHome = events.Count(e =>
                string.Equals(e.Kind, "Goal", StringComparison.OrdinalIgnoreCase) &&
                string.Equals(e.Side, "home", StringComparison.OrdinalIgnoreCase));
            var computedAway = events.Count(e =>
                string.Equals(e.Kind, "Goal", StringComparison.OrdinalIgnoreCase) &&
                string.Equals(e.Side, "away", StringComparison.OrdinalIgnoreCase));

            var clock = ComputeClockSecondsRemaining(fixture.FixtureDate, fixture.StartTime, fixture.EndTime);
            var formation = (await BuildMetricInsightsAsync(fixture.TeamId, fixture.Opponent, cancellationToken)).Formation;

            return new LiveMatchViewModel
            {
                Id = fixture.Id,
                HomeTeamName = fixture.HomeTeamName,
                AwayTeamName = string.IsNullOrWhiteSpace(fixture.Opponent) ? "Away" : fixture.Opponent,
                HomeScore = fixture.HomeScore ?? computedHome,
                AwayScore = fixture.AwayScore ?? computedAway,
                ClockSecondsRemaining = clock,
                Formation = string.IsNullOrWhiteSpace(formation) ? "4-3-3" : formation,
                Status = clock == 0 ? "Finished" : "Live",
                Events = events,
                Players = playerStats
            };
        }

        public async Task<MatchEventViewModel?> PostLiveMatchEventAsync(Guid matchId, CreateMatchEventViewModel model, CancellationToken cancellationToken = default)
        {
            var fixture = await _repository.Fixture.GetByIdAsync(matchId, cancellationToken);
            if (fixture is null || !IsCoachAssignedToTeam(fixture.TeamId))
            {
                return null;
            }

            var player = _repository.TeamPlayer
                .FindByCondition(tp => tp.TeamId == fixture.TeamId && tp.PlayerId == model.PlayerId)
                .Select(tp => new { tp.PlayerId, tp.Player.FirstName, tp.Player.LastName })
                .FirstOrDefault();
            if (player is null)
            {
                return null;
            }

            var kind = NormalizeKind(model.Kind);
            var side = NormalizeSide(model.Side);
            var minute = Math.Clamp(model.Minute, 0, 90);

            var assessment = new Assessment
            {
                Id = Guid.NewGuid(),
                PlayerId = player.PlayerId,
                CoachId = _currentUser.UserId,
                TeamId = fixture.TeamId,
                SportTemplateId = _repository.Team
                    .FindByCondition(t => t.Id == fixture.TeamId)
                    .Select(t => t.SportTemplateId)
                    .FirstOrDefault(),
                AssessmentDate = DateOnly.FromDateTime(DateTime.UtcNow),
                Metrics = new Dictionary<string, object>
                {
                    ["kind"] = kind,
                    ["side"] = side,
                    ["minute"] = minute
                },
                FreeText = $"Live event: {kind} ({side}) at {minute}'",
                IsMatchAssessment = true,
                FixtureId = fixture.Id,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _repository.Assessment.Create(assessment);

            if (string.Equals(kind, "Goal", StringComparison.OrdinalIgnoreCase))
            {
                fixture.HomeScore ??= 0;
                fixture.AwayScore ??= 0;
                if (string.Equals(side, "home", StringComparison.OrdinalIgnoreCase))
                {
                    fixture.HomeScore += 1;
                }
                else
                {
                    fixture.AwayScore += 1;
                }

                fixture.UpdatedAt = DateTime.UtcNow;
                _repository.Fixture.Update(fixture);
            }

            await _repository.SaveAsync(cancellationToken);

            await _milestoneService.EvaluateAssessmentAsync(assessment, cancellationToken);

            return new MatchEventViewModel
            {
                Id = assessment.Id,
                MatchId = fixture.Id,
                PlayerId = player.PlayerId,
                PlayerName = BuildFullName(player.FirstName, player.LastName),
                Kind = kind,
                Side = side,
                Minute = minute,
                CreatedAt = assessment.CreatedAt
            };
        }

        public Task<IReadOnlyList<AnnouncementViewModel>> GetAnnouncementsAsync(CancellationToken cancellationToken = default)
        {
            var tenantId = _currentUser.TenantId;

            IReadOnlyList<AnnouncementViewModel> announcements = _repository.Announcement
                .FindByCondition(a => a.TenantId == tenantId)
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => a.ToViewModel())
                .ToList();

            return Task.FromResult(announcements);
        }

        public async Task<AnnouncementViewModel?> CreateAnnouncementAsync(CreateAnnouncementViewModel model, CancellationToken cancellationToken = default)
        {
            if (model.TeamId.HasValue && !IsCoachAssignedToTeam(model.TeamId.Value))
            {
                return null;
            }

            var now = DateTime.UtcNow;
            var announcement = new Announcement
            {
                Id = Guid.NewGuid(),
                TenantId = _currentUser.TenantId,
                TeamId = model.TeamId,
                SenderId = _currentUser.UserId,
                Title = model.Title,
                Body = model.Body,
                Audience = model.Audience,
                Priority = model.Priority,
                Channel = model.Channel,
                SentAt = now,
                CreatedAt = now,
                UpdatedAt = now
            };

            _repository.Announcement.Create(announcement);
            await _repository.SaveAsync(cancellationToken);

            return announcement.ToViewModel();
        }

        public async Task<AnnouncementViewModel?> UpdateAnnouncementAsync(UpdateAnnouncementViewModel model, CancellationToken cancellationToken = default)
        {
            if (model.TeamId.HasValue && !IsCoachAssignedToTeam(model.TeamId.Value))
            {
                return null;
            }

            var tenantId = _currentUser.TenantId;
            var announcement = _repository.Announcement
                .FindByCondition(a => a.Id == model.Id && a.TenantId == tenantId, trackChanges: true)
                .FirstOrDefault();
            if (announcement is null)
            {
                return null;
            }

            announcement.TeamId = model.TeamId;
            announcement.Title = model.Title;
            announcement.Body = model.Body;
            announcement.Audience = model.Audience;
            announcement.Priority = model.Priority;
            announcement.Channel = model.Channel;
            announcement.UpdatedAt = DateTime.UtcNow;

            _repository.Announcement.Update(announcement);
            await _repository.SaveAsync(cancellationToken);

            return announcement.ToViewModel();
        }

        public async Task<bool> DeleteAnnouncementAsync(Guid announcementId, CancellationToken cancellationToken = default)
        {
            var tenantId = _currentUser.TenantId;
            var announcement = _repository.Announcement
                .FindByCondition(a => a.Id == announcementId && a.TenantId == tenantId, trackChanges: true)
                .FirstOrDefault();
            if (announcement is null)
            {
                return false;
            }

            _repository.Announcement.Delete(announcement);
            await _repository.SaveAsync(cancellationToken);
            return true;
        }

        private List<Guid> GetCoachTeamIds()
        {
            var tenantId = _currentUser.TenantId;
            var coachId = _currentUser.UserId;

            return _repository.TeamCoach
                .FindByCondition(tc => tc.CoachId == coachId && tc.Team.TenantId == tenantId)
                .Select(tc => tc.TeamId)
                .ToList();
        }

        private bool IsCoachAssignedToTeam(Guid teamId)
        {
            var tenantId = _currentUser.TenantId;
            var coachId = _currentUser.UserId;

            return _repository.TeamCoach
                .FindByCondition(tc => tc.TeamId == teamId
                    && tc.CoachId == coachId
                    && tc.Team.TenantId == tenantId)
                .Any();
        }

        private bool IsPlayerInCoachTeams(Guid playerId)
        {
            var teamIds = GetCoachTeamIds();
            return _repository.TeamPlayer
                .FindByCondition(tp => tp.PlayerId == playerId && teamIds.Contains(tp.TeamId))
                .Any();
        }

        private async Task<User?> CreatePlayerUserAsync(
            string firstName,
            string lastName,
            string? position,
            int? jerseyNumber,
            DateOnly? dateOfBirth)
        {
            var now = DateTime.UtcNow;
            var user = new User
            {
                Id = Guid.NewGuid(),
                TenantId = _currentUser.TenantId,
                Role = UserRole.Player,
                FirstName = firstName,
                LastName = lastName,
                PreferredPosition = position,
                JerseyNumber = jerseyNumber,
                DateOfBirth = dateOfBirth.HasValue
                    ? dateOfBirth.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc)
                    : null,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now
            };

            var result = await _userManager.CreateAsync(user);
            if (!result.Succeeded)
            {
                return null;
            }

            await _userManager.AddToRoleAsync(user, UserRole.Player.ToString());
            return user;
        }

        private async Task<User?> CreateUserAsync(
            UserRole role,
            string firstName,
            string lastName,
            string email,
            string? phone)
        {
            var now = DateTime.UtcNow;
            var user = new User
            {
                Id = Guid.NewGuid(),
                TenantId = _currentUser.TenantId,
                Role = role,
                UserName = email,
                Email = email,
                EmailConfirmed = true,
                Phone = phone,
                PhoneNumber = phone,
                FirstName = firstName,
                LastName = lastName,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now
            };

            var result = await _userManager.CreateAsync(user);
            if (!result.Succeeded)
            {
                return null;
            }

            await _userManager.AddToRoleAsync(user, role.ToString());
            return user;
        }

        private async Task LinkGuardianIfProvidedAsync(
            Guid playerId,
            string? guardianName,
            string? guardianEmail,
            string? guardianPhone,
            bool isPrimary)
        {
            if (string.IsNullOrWhiteSpace(guardianEmail) || string.IsNullOrWhiteSpace(guardianName))
            {
                return;
            }

            var (firstName, lastName) = SplitName(guardianName);
            var guardian = await _userManager.FindByEmailAsync(guardianEmail);
            if (guardian is null)
            {
                guardian = await CreateUserAsync(UserRole.Guardian, firstName, lastName, guardianEmail, guardianPhone);
                if (guardian is null)
                {
                    return;
                }

                guardian.IsPrimaryGuardian = isPrimary;
            }

            var alreadyLinked = _repository.PlayerGuardian
                .FindByCondition(pg => pg.PlayerId == playerId && pg.GuardianId == guardian.Id)
                .Any();

            if (!alreadyLinked)
            {
                _repository.PlayerGuardian.Create(new PlayerGuardian
                {
                    PlayerId = playerId,
                    GuardianId = guardian.Id,
                    IsPrimary = isPrimary,
                    ConsentPriority = isPrimary ? 1 : 2
                });
            }
        }

        private static (string FirstName, string LastName) SplitName(string fullName)
        {
            var trimmed = (fullName ?? string.Empty).Trim();
            if (trimmed.Length == 0)
            {
                return (string.Empty, string.Empty);
            }

            var parts = trimmed.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            return parts.Length == 1
                ? (parts[0], string.Empty)
                : (parts[0], parts[1]);
        }

        private async Task<MetricInsightsViewModel> BuildMetricInsightsAsync(
            Guid teamId,
            string? opponent,
            CancellationToken cancellationToken)
        {
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

            var h2h = 0.0;
            if (!string.IsNullOrWhiteSpace(opponent))
            {
                var h2hMatches = await _repository.Fixture
                    .FindByCondition(f => f.TeamId == teamId &&
                        f.Opponent == opponent &&
                        (f.Result == FixtureResult.Win || f.Result == FixtureResult.Draw || f.Result == FixtureResult.Loss))
                    .ToListAsync(cancellationToken);

                if (h2hMatches.Count > 0)
                {
                    var wins = h2hMatches.Count(f => f.Result == FixtureResult.Win);
                    var draws = h2hMatches.Count(f => f.Result == FixtureResult.Draw);
                    h2h = (wins + (draws * 0.5)) / h2hMatches.Count;
                }
            }

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
                    var totalGoals = g.Sum(x => ReadMetricDouble(x.Metrics, "goals"));
                    var totalAssists = g.Sum(x => ReadMetricDouble(x.Metrics, "assists"));

                    return new
                    {
                        PlayerId = g.Key,
                        MetricScore = (avgRating * 5) + (totalGoals * 3) + (totalAssists * 2)
                    };
                })
                .OrderByDescending(p => p.MetricScore)
                .FirstOrDefault();

            var starPlayerName = "N/A";
            double starPlayerMetricScore = 0;
            Guid? starPlayerId = null;
            if (topPlayer is not null)
            {
                starPlayerMetricScore = topPlayer.MetricScore;
                starPlayerId = topPlayer.PlayerId;
                var player = await _repository.User
                    .FindByCondition(u => u.Id == topPlayer.PlayerId)
                    .Select(u => new { u.FirstName, u.LastName })
                    .FirstOrDefaultAsync(cancellationToken);
                if (player is not null)
                {
                    starPlayerName = BuildFullName(player.FirstName, player.LastName);
                }
            }

            var formation = ResolveFormation(form, h2h);

            return new MetricInsightsViewModel
            {
                Formation = formation,
                Advice = ResolveAdvice(form, h2h),
                FormScore = Math.Round(form * 100, 2),
                H2HScore = Math.Round(h2h * 100, 2),
                StarPlayerId = starPlayerId,
                StarPlayerName = starPlayerName,
                StarPlayerMetricScore = Math.Round(starPlayerMetricScore, 2),
                StarPlayerSummary = starPlayerId.HasValue
                    ? "Top performer based on ratings, goals, and assists trends."
                    : "No player trend data available yet."
            };
        }

        private static string ResolveFormation(double form, double h2h)
        {
            if (form >= 0.65 && h2h >= 0.60) return "4-3-3 (Attacking)";
            if (form <= 0.35 || h2h <= 0.30) return "5-4-1 (Defensive)";
            return "4-4-2 (Balanced)";
        }

        private static string ResolveAdvice(double form, double h2h)
        {
            if (form >= 0.65 && h2h >= 0.60) return "Your metrics show dominance. Attack relentlessly!";
            if (form <= 0.35 || h2h <= 0.30) return "Metrics suggest a tough opponent. Stay compact.";
            return "Metrics are even. Control the midfield.";
        }

        private static string BuildFullName(string firstName, string lastName) =>
            $"{firstName} {lastName}".Trim();

        private static int ComputeClockSecondsRemaining(DateOnly fixtureDate, TimeOnly startTime, TimeOnly? endTime)
        {
            var nowUtc = DateTime.UtcNow;
            var matchStart = fixtureDate.ToDateTime(startTime, DateTimeKind.Utc);

            if (nowUtc < matchStart)
            {
                return 90 * 60;
            }

            if (endTime.HasValue)
            {
                var endedAt = fixtureDate.ToDateTime(endTime.Value, DateTimeKind.Utc);
                if (nowUtc >= endedAt)
                {
                    return 0;
                }
            }

            var elapsed = (int)Math.Floor((nowUtc - matchStart).TotalSeconds);
            return Math.Clamp((90 * 60) - Math.Max(0, elapsed), 0, 90 * 60);
        }

        private static string NormalizeKind(string kind)
        {
            if (string.Equals(kind, "assist", StringComparison.OrdinalIgnoreCase)) return "Assist";
            if (string.Equals(kind, "yellowcard", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(kind, "yellow card", StringComparison.OrdinalIgnoreCase)) return "YellowCard";
            return "Goal";
        }

        private static string NormalizeSide(string side) =>
            string.Equals(side, "away", StringComparison.OrdinalIgnoreCase) ? "away" : "home";

        private static string? ReadMetricString(Dictionary<string, object>? metrics, string key)
        {
            if (metrics is null)
            {
                return null;
            }

            foreach (var kvp in metrics)
            {
                if (!string.Equals(kvp.Key, key, StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                return kvp.Value switch
                {
                    null => null,
                    JsonElement element when element.ValueKind == JsonValueKind.String => element.GetString(),
                    JsonElement element => element.ToString(),
                    _ => kvp.Value.ToString()
                };
            }

            return null;
        }

        private static int ReadMetricInt(Dictionary<string, object>? metrics, string key)
        {
            var value = ReadMetricDouble(metrics, key);
            return (int)Math.Round(value);
        }

        private static double ReadMetricDouble(Dictionary<string, object>? metrics, string key)
        {
            if (metrics is null)
            {
                return 0;
            }

            foreach (var kvp in metrics)
            {
                if (!string.Equals(kvp.Key, key, StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                return kvp.Value switch
                {
                    null => 0,
                    JsonElement element when element.ValueKind == JsonValueKind.Number && element.TryGetDouble(out var parsed) => parsed,
                    JsonElement element when element.ValueKind == JsonValueKind.String && double.TryParse(element.GetString(), NumberStyles.Any, CultureInfo.InvariantCulture, out var fromString) => fromString,
                    _ => double.TryParse(kvp.Value.ToString(), NumberStyles.Any, CultureInfo.InvariantCulture, out var converted) ? converted : 0
                };
            }

            return 0;
        }
    }
}
