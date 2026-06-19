using System;
using System.Collections.Generic;
using System.Text;

namespace Diskie.DataAccess.Model.Models.Enums
{
    // Enums/UserRole.cs
    public enum UserRole { SuperAdmin, SchoolAdmin, Coach, Player, Guardian }

    // Enums/AttendanceStatus.cs
    public enum AttendanceStatus { Present, Absent, Late, Excused }

    // Enums/AvailabilityStatus.cs
    public enum AvailabilityStatus { Available, Unavailable, NoResponse }

    // Enums/InjurySeverity.cs
    public enum InjurySeverity { Mild, Moderate, Severe }

    // Enums/InjuryStatus.cs
    public enum InjuryStatus { Active, Recovering, Recovered }

    // Enums/FixtureType.cs
    public enum FixtureType { Home, Away, Neutral }

    // Enums/FixtureResult.cs
    public enum FixtureResult { Win, Loss, Draw, Cancelled, Postponed }

    // Enums/ConsentStatus.cs
    public enum ConsentStatus { Pending, Signed, Withdrawn, Expired }

    // Enums/DevelopmentGoalStatus.cs
    public enum DevelopmentGoalStatus { NotStarted, InProgress, Achieved, Abandoned }

    // Enums/MessageChannel.cs
    public enum MessageChannel { WhatsApp, Email, Sms, Push }

    // Enums/BillingPlan.cs
    public enum BillingPlan { Free, Starter, Pro, Enterprise }

    // Enums/SportType.cs
    public enum SportType { Football, Rugby, Netball, Cricket }

    // Enums/SportRequestStatus.cs
    public enum SportRequestStatus { Pending, Approved, Rejected }

    // Enums/AnnouncementAudience.cs
    public enum AnnouncementAudience { Team, Players, Guardians, Everyone }

    // Enums/AnnouncementPriority.cs
    public enum AnnouncementPriority { Normal, Important, Urgent }
}
