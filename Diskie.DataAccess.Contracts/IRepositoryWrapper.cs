namespace Diskie.DataAccess.Contracts
{
    public interface IRepositoryWrapper
    {
        ITenantRepository Tenant { get; }
        IUserRepository User { get; }
        ISportTemplateRepository SportTemplate { get; }
        ISeasonRepository Season { get; }
        ITeamRepository Team { get; }
        ITeamPlayerRepository TeamPlayer { get; }
        ITeamCoachRepository TeamCoach { get; }
        IPlayerGuardianRepository PlayerGuardian { get; }
        IFixtureRepository Fixture { get; }
        IAttendanceRepository Attendance { get; }
        IAvailabilityRepository Availability { get; }
        IInjuryRepository Injury { get; }
        IAssessmentRepository Assessment { get; }
        IConsentFormRepository ConsentForm { get; }
        IPlayerConsentRepository PlayerConsent { get; }
        IDevelopmentGoalRepository DevelopmentGoal { get; }
        IGuardianMessagePreferenceRepository GuardianMessagePreference { get; }
        IAnnouncementRepository Announcement { get; }

        Task<int> SaveAsync(CancellationToken cancellationToken = default);
    }
}
