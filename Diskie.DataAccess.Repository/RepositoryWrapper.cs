using Diskie.DataAccess.Contracts;

namespace Diskie.DataAccess.Repository
{
    public class RepositoryWrapper : IRepositoryWrapper
    {
        private readonly DiskiDbContext _repositoryContext;

        private ITenantRepository? _tenant;
        private IUserRepository? _user;
        private ISportTemplateRepository? _sportTemplate;
        private ISeasonRepository? _season;
        private ITeamRepository? _team;
        private ITeamPlayerRepository? _teamPlayer;
        private ITeamCoachRepository? _teamCoach;
        private IPlayerGuardianRepository? _playerGuardian;
        private IFixtureRepository? _fixture;
        private IAttendanceRepository? _attendance;
        private IAvailabilityRepository? _availability;
        private IInjuryRepository? _injury;
        private IAssessmentRepository? _assessment;
        private IConsentFormRepository? _consentForm;
        private IPlayerConsentRepository? _playerConsent;
        private IDevelopmentGoalRepository? _developmentGoal;
        private IGuardianMessagePreferenceRepository? _guardianMessagePreference;
        private IAnnouncementRepository? _announcement;

        public RepositoryWrapper(DiskiDbContext repositoryContext)
        {
            _repositoryContext = repositoryContext;
        }

        public ITenantRepository Tenant =>
            _tenant ??= new TenantRepository(_repositoryContext);

        public IUserRepository User =>
            _user ??= new UserRepository(_repositoryContext);

        public ISportTemplateRepository SportTemplate =>
            _sportTemplate ??= new SportTemplateRepository(_repositoryContext);

        public ISeasonRepository Season =>
            _season ??= new SeasonRepository(_repositoryContext);

        public ITeamRepository Team =>
            _team ??= new TeamRepository(_repositoryContext);

        public ITeamPlayerRepository TeamPlayer =>
            _teamPlayer ??= new TeamPlayerRepository(_repositoryContext);

        public ITeamCoachRepository TeamCoach =>
            _teamCoach ??= new TeamCoachRepository(_repositoryContext);

        public IPlayerGuardianRepository PlayerGuardian =>
            _playerGuardian ??= new PlayerGuardianRepository(_repositoryContext);

        public IFixtureRepository Fixture =>
            _fixture ??= new FixtureRepository(_repositoryContext);

        public IAttendanceRepository Attendance =>
            _attendance ??= new AttendanceRepository(_repositoryContext);

        public IAvailabilityRepository Availability =>
            _availability ??= new AvailabilityRepository(_repositoryContext);

        public IInjuryRepository Injury =>
            _injury ??= new InjuryRepository(_repositoryContext);

        public IAssessmentRepository Assessment =>
            _assessment ??= new AssessmentRepository(_repositoryContext);

        public IConsentFormRepository ConsentForm =>
            _consentForm ??= new ConsentFormRepository(_repositoryContext);

        public IPlayerConsentRepository PlayerConsent =>
            _playerConsent ??= new PlayerConsentRepository(_repositoryContext);

        public IDevelopmentGoalRepository DevelopmentGoal =>
            _developmentGoal ??= new DevelopmentGoalRepository(_repositoryContext);

        public IGuardianMessagePreferenceRepository GuardianMessagePreference =>
            _guardianMessagePreference ??= new GuardianMessagePreferenceRepository(_repositoryContext);

        public IAnnouncementRepository Announcement =>
            _announcement ??= new AnnouncementRepository(_repositoryContext);

        public async Task<int> SaveAsync(CancellationToken cancellationToken = default) =>
            await _repositoryContext.SaveChangesAsync(cancellationToken);
    }
}
