using Diskie.DataAccess.Model.Models.DbModels;
using Diskie.DataAccess.Model.Models.Enums;
using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Reflection.Metadata;
using System.Text;

namespace Diskie.DataAccess.Model.DbModels
{
    public class User : IdentityUser<Guid>
    {
            public DateTime CreatedAt { get; set; }
            public DateTime UpdatedAt { get; set; }

            public Guid? TenantId { get; set; }
            public Tenant? Tenant { get; set; }

            // Core
            public UserRole Role { get; set; }
            public string? Phone { get; set; }

            public string FirstName { get; set; } = null!;
            public string LastName { get; set; } = null!;
            public string? ProfilePhotoUrl { get; set; }
            public bool IsActive { get; set; } = true;
            public DateTime? LastLoginAt { get; set; }

            // Player fields
            public DateTime? DateOfBirth { get; set; }
            public string? Gender { get; set; }
            public Dictionary<string, object>? MedicalInfo { get; set; }
            public string? EmergencyContactName { get; set; }
            public string? EmergencyContactPhone { get; set; }
            public string? EmergencyContactRelationship { get; set; }
            public int? JerseyNumber { get; set; }
            public string? PreferredPosition { get; set; }
            public bool IsBoarding { get; set; }

            // Guardian fields
            public string? Relationship { get; set; }
            public bool IsPrimaryGuardian { get; set; }
            public bool CanConsent { get; set; } = true;
            public bool ReceivesUpdates { get; set; } = true;

            // Coach fields
            public string? Qualification { get; set; }
            public int? ExperienceYears { get; set; }
            public List<string>? SportSpecializations { get; set; }
            public string? CoachingLicense { get; set; }

            // Admin fields
            public Dictionary<string, bool>? Permissions { get; set; }

            // Navigation 
            public ICollection<Team> CaptainedTeams { get; set; } = new List<Team>();
            public ICollection<Team> ViceCaptainedTeams { get; set; } = new List<Team>();

           
            public ICollection<TeamPlayer> TeamPlayers { get; set; } = new List<TeamPlayer>();
            public ICollection<TeamCoach> TeamCoaches { get; set; } = new List<TeamCoach>();
            public ICollection<PlayerGuardian> PlayerGuardians { get; set; } = new List<PlayerGuardian>();
            public ICollection<GuardianMessagePreference> GuardianMessagePreferences { get; set; } = new List<GuardianMessagePreference>();

            
            public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
            public ICollection<Availability> Availabilities { get; set; } = new List<Availability>();
            public ICollection<Injury> Injuries { get; set; } = new List<Injury>();
            public ICollection<Injury> ReportedInjuries { get; set; } = new List<Injury>();
            public ICollection<Assessment> Assessments { get; set; } = new List<Assessment>();
            public ICollection<Assessment> AssessmentsGiven { get; set; } = new List<Assessment>();
            public ICollection<DevelopmentGoal> DevelopmentGoals { get; set; } = new List<DevelopmentGoal>();
            public ICollection<DevelopmentGoal> GoalsSet { get; set; } = new List<DevelopmentGoal>();
            public ICollection<PlayerConsent> PlayerConsents { get; set; } = new List<PlayerConsent>();
    }
}