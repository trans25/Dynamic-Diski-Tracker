using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Diskie.DataAccess.Model.Migrations
{
    /// <inheritdoc />
    public partial class AddOperationalAndApprovalFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsApproved",
                table: "Tenants",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "IdNumber",
                table: "AspNetUsers",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Alerts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PlayerId = table.Column<Guid>(type: "uuid", nullable: false),
                    MatchId = table.Column<Guid>(type: "uuid", nullable: true),
                    Message = table.Column<string>(type: "text", nullable: false),
                    Severity = table.Column<string>(type: "text", nullable: false),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Alerts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Alerts_AspNetUsers_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Alerts_Fixtures_MatchId",
                        column: x => x.MatchId,
                        principalTable: "Fixtures",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "PlayerAchievements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PlayerId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    IconKey = table.Column<string>(type: "text", nullable: false),
                    AwardedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FixtureId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlayerAchievements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlayerAchievements_AspNetUsers_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlayerAchievements_Fixtures_FixtureId",
                        column: x => x.FixtureId,
                        principalTable: "Fixtures",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "PlayerSkills",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PlayerId = table.Column<Guid>(type: "uuid", nullable: false),
                    Attacking = table.Column<int>(type: "integer", nullable: false),
                    Defending = table.Column<int>(type: "integer", nullable: false),
                    Passing = table.Column<int>(type: "integer", nullable: false),
                    Physicality = table.Column<int>(type: "integer", nullable: false),
                    Composure = table.Column<int>(type: "integer", nullable: false),
                    Season = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlayerSkills", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlayerSkills_AspNetUsers_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TacticalLayouts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    Data = table.Column<string>(type: "jsonb", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TacticalLayouts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TacticalLayouts_Fixtures_MatchId",
                        column: x => x.MatchId,
                        principalTable: "Fixtures",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TrainingAttendances",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PlayerId = table.Column<Guid>(type: "uuid", nullable: false),
                    SessionDate = table.Column<DateOnly>(type: "date", nullable: false),
                    IsPresent = table.Column<bool>(type: "boolean", nullable: false),
                    IsLate = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainingAttendances", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TrainingAttendances_AspNetUsers_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Alerts_MatchId",
                table: "Alerts",
                column: "MatchId");

            migrationBuilder.CreateIndex(
                name: "IX_Alerts_PlayerId_IsRead_CreatedAt",
                table: "Alerts",
                columns: new[] { "PlayerId", "IsRead", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_PlayerAchievements_FixtureId",
                table: "PlayerAchievements",
                column: "FixtureId");

            migrationBuilder.CreateIndex(
                name: "IX_PlayerAchievements_PlayerId_Type_FixtureId",
                table: "PlayerAchievements",
                columns: new[] { "PlayerId", "Type", "FixtureId" });

            migrationBuilder.CreateIndex(
                name: "IX_PlayerSkills_PlayerId_Season_CreatedAt",
                table: "PlayerSkills",
                columns: new[] { "PlayerId", "Season", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_TacticalLayouts_MatchId",
                table: "TacticalLayouts",
                column: "MatchId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TrainingAttendances_PlayerId_SessionDate",
                table: "TrainingAttendances",
                columns: new[] { "PlayerId", "SessionDate" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Alerts");

            migrationBuilder.DropTable(
                name: "PlayerAchievements");

            migrationBuilder.DropTable(
                name: "PlayerSkills");

            migrationBuilder.DropTable(
                name: "TacticalLayouts");

            migrationBuilder.DropTable(
                name: "TrainingAttendances");

            migrationBuilder.DropColumn(
                name: "IsApproved",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "IdNumber",
                table: "AspNetUsers");
        }
    }
}
