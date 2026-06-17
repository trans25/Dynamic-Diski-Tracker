using Diskie.DataAccess.Model.DbModels;
using Diskie.DataAccess.Model.Models.DbModels;
using Diskie.DataAccess.Model.Models.ViewModels;

namespace Diskie.API.Mapping
{
    public static class MappingExtensions
    {
        public static TenantViewModel ToViewModel(this Tenant entity) => new()
        {
            Id = entity.Id,
            Name = entity.Name,
            Address = entity.Address,
            City = entity.City,
            Province = entity.Province,
            Phone = entity.Phone,
            Email = entity.Email,
            LogoUrl = entity.LogoUrl,
            IsActive = entity.IsActive,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        };

        public static UserViewModel ToViewModel(this User entity) => new()
        {
            Id = entity.Id,
            TenantId = entity.TenantId,
            Role = entity.Role,
            Email = entity.Email,
            Phone = entity.Phone,
            FirstName = entity.FirstName,
            LastName = entity.LastName,
            ProfilePhotoUrl = entity.ProfilePhotoUrl,
            IsActive = entity.IsActive,
            LastLoginAt = entity.LastLoginAt,
            DateOfBirth = entity.DateOfBirth,
            Gender = entity.Gender,
            EmergencyContactName = entity.EmergencyContactName,
            EmergencyContactPhone = entity.EmergencyContactPhone,
            EmergencyContactRelationship = entity.EmergencyContactRelationship,
            JerseyNumber = entity.JerseyNumber,
            PreferredPosition = entity.PreferredPosition,
            IsBoarding = entity.IsBoarding,
            Relationship = entity.Relationship,
            IsPrimaryGuardian = entity.IsPrimaryGuardian,
            CanConsent = entity.CanConsent,
            ReceivesUpdates = entity.ReceivesUpdates,
            Qualification = entity.Qualification,
            ExperienceYears = entity.ExperienceYears,
            SportSpecializations = entity.SportSpecializations,
            CoachingLicense = entity.CoachingLicense
        };

        public static SportTemplateViewModel ToViewModel(this SportTemplate entity) => new()
        {
            Id = entity.Id,
            Name = entity.Name,
            DisplayName = entity.DisplayName,
            Icon = entity.Icon,
            Description = entity.Description,
            AssessmentMetrics = entity.AssessmentMetrics,
            MatchStatsFields = entity.MatchStatsFields,
            PositionOptions = entity.PositionOptions,
            DefaultSeasonWeeks = entity.DefaultSeasonWeeks,
            IsActive = entity.IsActive,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        };

        public static TenantBillingViewModel ToBillingViewModel(this Tenant entity) => new()
        {
            TenantId = entity.Id,
            TenantName = entity.Name,
            BillingPlan = entity.BillingPlan,
            BillingPlanAssignedAt = entity.BillingPlanAssignedAt
        };

        public static FixtureViewModel ToViewModel(this Fixture entity) => new()
        {
            Id = entity.Id,
            TeamId = entity.TeamId,
            SeasonId = entity.SeasonId,
            FixtureDate = entity.FixtureDate,
            StartTime = entity.StartTime,
            EndTime = entity.EndTime,
            Venue = entity.Venue,
            Opponent = entity.Opponent,
            Type = entity.Type,
            Result = entity.Result,
            HomeScore = entity.HomeScore,
            AwayScore = entity.AwayScore,
            MatchReport = entity.MatchReport,
            IsTraining = entity.IsTraining,
            IsCancelled = entity.IsCancelled,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        };

        public static InjuryViewModel ToViewModel(this Injury entity) => new()
        {
            Id = entity.Id,
            PlayerId = entity.PlayerId,
            InjuryType = entity.InjuryType,
            BodyPart = entity.BodyPart,
            Severity = entity.Severity,
            OccurredAt = entity.OccurredAt,
            EstimatedReturnDate = entity.EstimatedReturnDate,
            ActualReturnDate = entity.ActualReturnDate,
            Status = entity.Status,
            MedicalNotes = entity.MedicalNotes,
            TreatmentNotes = entity.TreatmentNotes,
            ReportedBy = entity.ReportedBy,
            IsMatchInjury = entity.IsMatchInjury,
            FixtureId = entity.FixtureId,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        };

        public static AnnouncementViewModel ToViewModel(this Announcement entity) => new()
        {
            Id = entity.Id,
            TenantId = entity.TenantId,
            TeamId = entity.TeamId,
            SenderId = entity.SenderId,
            Title = entity.Title,
            Body = entity.Body,
            Audience = entity.Audience,
            Priority = entity.Priority,
            Channel = entity.Channel,
            SentAt = entity.SentAt,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        };
    }
}
