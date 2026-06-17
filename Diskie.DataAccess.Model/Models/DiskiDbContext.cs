using Diskie.DataAccess.Model.DbModels;
using Diskie.DataAccess.Model.Models.DbModels;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

public class DiskiDbContext : IdentityDbContext<User, IdentityRole<Guid>, Guid>
{
    public DiskiDbContext(DbContextOptions<DiskiDbContext> options) : base(options) 
    { 
    }

    public DbSet<Tenant> Tenants { get; set; }
    public DbSet<SportTemplate> SportTemplates { get; set; }
    public DbSet<Season> Seasons { get; set; }
    public DbSet<Team> Teams { get; set; }
    public DbSet<TeamPlayer> TeamPlayers { get; set; }
    public DbSet<TeamCoach> TeamCoaches { get; set; }
    public DbSet<PlayerGuardian> PlayerGuardians { get; set; }
    public DbSet<Fixture> Fixtures { get; set; }
    public DbSet<Attendance> Attendances { get; set; }
    public DbSet<Availability> Availabilities { get; set; }
    public DbSet<Injury> Injuries { get; set; }
    public DbSet<Assessment> Assessments { get; set; }
    public DbSet<ConsentForm> ConsentForms { get; set; }
    public DbSet<PlayerConsent> PlayerConsents { get; set; }
    public DbSet<DevelopmentGoal> DevelopmentGoals { get; set; }
    public DbSet<GuardianMessagePreference> GuardianMessagePreferences { get; set; }
    public DbSet<Announcement> Announcements { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Composite keys
        modelBuilder.Entity<TeamPlayer>().HasKey(tp => new { tp.TeamId, tp.PlayerId });
        modelBuilder.Entity<TeamCoach>().HasKey(tc => new { tc.TeamId, tc.CoachId });
        modelBuilder.Entity<PlayerGuardian>().HasKey(pg => new { pg.PlayerId, pg.GuardianId });
        modelBuilder.Entity<PlayerConsent>().HasKey(pc => new { pc.PlayerId, pc.ConsentFormId });

        // Enums as strings
        modelBuilder.Entity<User>().Property(u => u.Role).HasConversion<string>();
        modelBuilder.Entity<Attendance>().Property(a => a.Status).HasConversion<string>();
        modelBuilder.Entity<Availability>().Property(a => a.Status).HasConversion<string>();
        modelBuilder.Entity<Injury>().Property(i => i.Severity).HasConversion<string>();
        modelBuilder.Entity<Injury>().Property(i => i.Status).HasConversion<string>();
        modelBuilder.Entity<Fixture>().Property(f => f.Type).HasConversion<string>();
        modelBuilder.Entity<Fixture>().Property(f => f.Result).HasConversion<string>();
        modelBuilder.Entity<PlayerConsent>().Property(pc => pc.Status).HasConversion<string>();
        modelBuilder.Entity<DevelopmentGoal>().Property(dg => dg.Status).HasConversion<string>();
        modelBuilder.Entity<GuardianMessagePreference>().Property(gmp => gmp.Channel).HasConversion<string>();

        // JSON columns 
        modelBuilder.Entity<User>()
            .Property(u => u.MedicalInfo)
            .HasColumnType("jsonb");
        modelBuilder.Entity<User>()
            .Property(u => u.SportSpecializations)
            .HasColumnType("jsonb");
        modelBuilder.Entity<User>()
            .Property(u => u.Permissions)
            .HasColumnType("jsonb");
        modelBuilder.Entity<SportTemplate>()
            .Property(st => st.AssessmentMetrics)
            .HasColumnType("jsonb");
        modelBuilder.Entity<SportTemplate>()
            .Property(st => st.MatchStatsFields)
            .HasColumnType("jsonb");
        modelBuilder.Entity<SportTemplate>()
            .Property(st => st.PositionOptions)
            .HasColumnType("jsonb");
        modelBuilder.Entity<Assessment>()
            .Property(a => a.Metrics)
            .HasColumnType("jsonb");

        // Unique constraints
        modelBuilder.Entity<SportTemplate>().HasIndex(st => st.Name).IsUnique();
        modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique().HasFilter("\"Email\" IS NOT NULL");
        modelBuilder.Entity<Team>().HasIndex(t => new { t.SeasonId, t.Name }).IsUnique();
        modelBuilder.Entity<Attendance>().HasIndex(a => new { a.PlayerId, a.SessionDate, a.TeamId }).IsUnique();
        modelBuilder.Entity<Availability>().HasIndex(a => new { a.PlayerId, a.FixtureId }).IsUnique();
        modelBuilder.Entity<PlayerConsent>().HasIndex(pc => new { pc.PlayerId, pc.ConsentFormId }).IsUnique();

        // Relationships
        modelBuilder.Entity<Team>()
            .HasOne(t => t.Captain)
            .WithMany(u => u.CaptainedTeams)
            .HasForeignKey(t => t.CaptainId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Team>()
            .HasOne(t => t.ViceCaptain)
            .WithMany(u => u.ViceCaptainedTeams)
            .HasForeignKey(t => t.ViceCaptainId)
            .OnDelete(DeleteBehavior.SetNull);

        // Assessment has two FKs to User 
        modelBuilder.Entity<Assessment>()
            .HasOne(a => a.Player)
            .WithMany(u => u.Assessments)
            .HasForeignKey(a => a.PlayerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Assessment>()
            .HasOne(a => a.Coach)
            .WithMany(u => u.AssessmentsGiven)
            .HasForeignKey(a => a.CoachId)
            .OnDelete(DeleteBehavior.Restrict);

        // Injury has two FKs to User 
        modelBuilder.Entity<Injury>()
            .HasOne(i => i.Player)
            .WithMany(u => u.Injuries)
            .HasForeignKey(i => i.PlayerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Injury>()
            .HasOne(i => i.Reporter)
            .WithMany(u => u.ReportedInjuries)
            .HasForeignKey(i => i.ReportedBy)
            .OnDelete(DeleteBehavior.SetNull);

        // Attendance has two FKs to User 
        modelBuilder.Entity<Attendance>()
            .HasOne(a => a.Player)
            .WithMany(u => u.Attendances)
            .HasForeignKey(a => a.PlayerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Attendance>()
            .HasOne(a => a.Recorder)
            .WithMany()
            .HasForeignKey(a => a.RecordedBy)
            .OnDelete(DeleteBehavior.SetNull);

        // PlayerGuardian has two FKs to User
        modelBuilder.Entity<PlayerGuardian>()
            .HasOne(pg => pg.Player)
            .WithMany(u => u.PlayerGuardians)
            .HasForeignKey(pg => pg.PlayerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<PlayerGuardian>()
            .HasOne(pg => pg.Guardian)
            .WithMany()
            .HasForeignKey(pg => pg.GuardianId)
            .OnDelete(DeleteBehavior.Restrict);

        // DevelopmentGoal has two FKs to User
        modelBuilder.Entity<DevelopmentGoal>()
            .HasOne(dg => dg.Player)
            .WithMany(u => u.DevelopmentGoals)
            .HasForeignKey(dg => dg.PlayerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<DevelopmentGoal>()
            .HasOne(dg => dg.Coach)
            .WithMany(u => u.GoalsSet)
            .HasForeignKey(dg => dg.CoachId)
            .OnDelete(DeleteBehavior.Restrict);

        // GuardianMessagePreference -> User
        modelBuilder.Entity<GuardianMessagePreference>()
            .HasOne(gmp => gmp.Guardian)
            .WithMany(u => u.GuardianMessagePreferences)
            .HasForeignKey(gmp => gmp.GuardianId)
            .OnDelete(DeleteBehavior.Restrict);

        // Announcement
        modelBuilder.Entity<Announcement>().Property(a => a.Audience).HasConversion<string>();
        modelBuilder.Entity<Announcement>().Property(a => a.Priority).HasConversion<string>();
        modelBuilder.Entity<Announcement>().Property(a => a.Channel).HasConversion<string>();
        modelBuilder.Entity<Announcement>().HasIndex(a => a.TenantId);

        modelBuilder.Entity<Announcement>()
            .HasOne(a => a.Tenant)
            .WithMany()
            .HasForeignKey(a => a.TenantId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Announcement>()
            .HasOne(a => a.Team)
            .WithMany()
            .HasForeignKey(a => a.TeamId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Announcement>()
            .HasOne(a => a.Sender)
            .WithMany()
            .HasForeignKey(a => a.SenderId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}