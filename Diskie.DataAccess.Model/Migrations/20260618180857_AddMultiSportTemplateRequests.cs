using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Diskie.DataAccess.Model.Migrations
{
    /// <inheritdoc />
    public partial class AddMultiSportTemplateRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AssignedSportTemplateId",
                table: "Tenants",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MetricDefinitions",
                table: "SportTemplates",
                type: "jsonb",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PositionDefinitions",
                table: "SportTemplates",
                type: "jsonb",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SportType",
                table: "SportTemplates",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "TenantSportRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    RequestedSportTemplateId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    RequestedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TenantSportRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TenantSportRequests_SportTemplates_RequestedSportTemplateId",
                        column: x => x.RequestedSportTemplateId,
                        principalTable: "SportTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TenantSportRequests_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Tenants_AssignedSportTemplateId",
                table: "Tenants",
                column: "AssignedSportTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_TenantSportRequests_RequestedSportTemplateId",
                table: "TenantSportRequests",
                column: "RequestedSportTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_TenantSportRequests_Status_RequestedDate",
                table: "TenantSportRequests",
                columns: new[] { "Status", "RequestedDate" });

            migrationBuilder.CreateIndex(
                name: "IX_TenantSportRequests_TenantId",
                table: "TenantSportRequests",
                column: "TenantId");

            migrationBuilder.AddForeignKey(
                name: "FK_Tenants_SportTemplates_AssignedSportTemplateId",
                table: "Tenants",
                column: "AssignedSportTemplateId",
                principalTable: "SportTemplates",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tenants_SportTemplates_AssignedSportTemplateId",
                table: "Tenants");

            migrationBuilder.DropTable(
                name: "TenantSportRequests");

            migrationBuilder.DropIndex(
                name: "IX_Tenants_AssignedSportTemplateId",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "AssignedSportTemplateId",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "MetricDefinitions",
                table: "SportTemplates");

            migrationBuilder.DropColumn(
                name: "PositionDefinitions",
                table: "SportTemplates");

            migrationBuilder.DropColumn(
                name: "SportType",
                table: "SportTemplates");
        }
    }
}
