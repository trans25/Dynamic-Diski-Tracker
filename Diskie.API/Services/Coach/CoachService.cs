using Diskie.API.Mapping;
using Diskie.API.Security;
using Diskie.DataAccess.Contracts;
using Diskie.DataAccess.Model.Models.DbModels;
using Diskie.DataAccess.Model.Models.Enums;
using Diskie.DataAccess.Model.Models.ViewModels;

namespace Diskie.API.Services.Coach
{
    public class CoachService : ICoachService
    {
        private readonly IRepositoryWrapper _repository;
        private readonly ICurrentUserContext _currentUser;

        public CoachService(IRepositoryWrapper repository, ICurrentUserContext currentUser)
        {
            _repository = repository;
            _currentUser = currentUser;
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

            return new CoachDashboardViewModel
            {
                TeamCount = teams.Count,
                PlayerCount = playerIds.Count,
                UpcomingFixtureCount = upcomingFixtures.Count,
                ActiveInjuryCount = activeInjuryCount,
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
    }
}
