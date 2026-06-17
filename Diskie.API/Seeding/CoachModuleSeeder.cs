using Diskie.DataAccess.Model.DbModels;
using Diskie.DataAccess.Model.Models.DbModels;
using Diskie.DataAccess.Model.Models.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Diskie.API.Seeding
{
    /// <summary>
    /// Idempotent development seeder that creates a single tenant with a Coach user,
    /// one team assigned to that coach, and one player on the roster. A second tenant
    /// with its own coach is also created so tenant-isolation can be verified.
    /// Users and roles are provisioned through ASP.NET Identity. Intended for Development only.
    /// </summary>
    public static class CoachModuleSeeder
    {
        private const string DefaultPassword = "Coach@123";

        public static async Task SeedAsync(
            DiskiDbContext context,
            UserManager<User> userManager,
            RoleManager<IdentityRole<Guid>> roleManager,
            CancellationToken cancellationToken = default)
        {
            await SeedRolesAsync(roleManager);

            if (await context.Users.AnyAsync(u => u.Role == UserRole.Coach, cancellationToken))
            {
                return;
            }

            var now = DateTime.UtcNow;

            // ---- Tenants, template, seasons and teams (persisted first so user FKs are valid) ----
            var tenantA = NewTenant("Springfield Sports Academy", now);
            var tenantB = NewTenant("Gotham United FC", now);
            var sportTemplate = NewSportTemplate("soccer", "Soccer", now);
            var seasonA = NewSeason(tenantA.Id, sportTemplate.Id, "2025 Season", now);
            var seasonB = NewSeason(tenantB.Id, sportTemplate.Id, "2025 Season", now);
            var teamA = NewTeam(tenantA.Id, seasonA.Id, sportTemplate.Id, "U15 Boys", now);
            var teamB = NewTeam(tenantB.Id, seasonB.Id, sportTemplate.Id, "U17 Girls", now);

            context.Tenants.AddRange(tenantA, tenantB);
            context.SportTemplates.Add(sportTemplate);
            context.Seasons.AddRange(seasonA, seasonB);
            context.Teams.AddRange(teamA, teamB);
            await context.SaveChangesAsync(cancellationToken);

            // ---- Users (via Identity) ----
            var coachA = await CreateUserAsync(userManager, tenantA.Id, UserRole.Coach, "coach.a@diskie.dev", "Alex", "Coach", now);
            var playerA = await CreateUserAsync(userManager, tenantA.Id, UserRole.Player, "player.a@diskie.dev", "Pat", "Player", now);
            var coachB = await CreateUserAsync(userManager, tenantB.Id, UserRole.Coach, "coach.b@diskie.dev", "Blake", "Coach", now);

            // ---- Join data ----
            context.TeamCoaches.AddRange(
                new TeamCoach { TeamId = teamA.Id, CoachId = coachA.Id, Role = "Head Coach", IsPrimary = true },
                new TeamCoach { TeamId = teamB.Id, CoachId = coachB.Id, Role = "Head Coach", IsPrimary = true });

            context.TeamPlayers.Add(new TeamPlayer
            {
                TeamId = teamA.Id,
                PlayerId = playerA.Id,
                Role = "Starter",
                JerseyNumber = 10,
                Position = "Midfield",
                IsActive = true
            });

            context.Fixtures.Add(new Fixture
            {
                Id = Guid.NewGuid(),
                TeamId = teamA.Id,
                SeasonId = seasonA.Id,
                FixtureDate = DateOnly.FromDateTime(now.AddDays(7)),
                StartTime = new TimeOnly(15, 0),
                Type = FixtureType.Home,
                Opponent = "Riverdale High",
                CreatedAt = now,
                UpdatedAt = now
            });

            await context.SaveChangesAsync(cancellationToken);
        }

        private static async Task SeedRolesAsync(RoleManager<IdentityRole<Guid>> roleManager)
        {
            foreach (var role in Enum.GetNames<UserRole>())
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new IdentityRole<Guid>(role)
                    {
                        Id = Guid.NewGuid()
                    });
                }
            }
        }

        private static async Task<User> CreateUserAsync(
            UserManager<User> userManager,
            Guid tenantId,
            UserRole role,
            string email,
            string firstName,
            string lastName,
            DateTime now)
        {
            var user = new User
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                Role = role,
                UserName = email,
                Email = email,
                EmailConfirmed = true,
                FirstName = firstName,
                LastName = lastName,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now
            };

            var result = await userManager.CreateAsync(user, DefaultPassword);
            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Failed to seed user '{email}': {errors}");
            }

            await userManager.AddToRoleAsync(user, role.ToString());
            return user;
        }

        private static Tenant NewTenant(string name, DateTime now) => new()
        {
            Id = Guid.NewGuid(),
            Name = name,
            IsActive = true,
            BillingPlan = BillingPlan.Free,
            CreatedAt = now,
            UpdatedAt = now
        };

        private static Season NewSeason(Guid tenantId, Guid sportTemplateId, string name, DateTime now) => new()
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            SportTemplateId = sportTemplateId,
            Name = name,
            StartDate = DateOnly.FromDateTime(now),
            EndDate = DateOnly.FromDateTime(now.AddMonths(6)),
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        private static SportTemplate NewSportTemplate(string name, string displayName, DateTime now) => new()
        {
            Id = Guid.NewGuid(),
            Name = name,
            DisplayName = displayName,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        private static Team NewTeam(Guid tenantId, Guid seasonId, Guid sportTemplateId, string name, DateTime now) => new()
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            SeasonId = seasonId,
            SportTemplateId = sportTemplateId,
            Name = name,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };
    }
}
