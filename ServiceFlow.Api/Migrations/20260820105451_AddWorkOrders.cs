using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ServiceFlow.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkOrders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddUniqueConstraint(
                name: "AK_ServiceLocations_Id_OrganizationId",
                table: "ServiceLocations",
                columns: new[] { "Id", "OrganizationId" });

            migrationBuilder.CreateTable(
                name: "WorkOrders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ServiceLocationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    Priority = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DueUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ScheduledStartUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ScheduledEndUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkOrders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkOrders_ServiceLocations_ServiceLocationId_OrganizationId",
                        columns: x => new { x.ServiceLocationId, x.OrganizationId },
                        principalTable: "ServiceLocations",
                        principalColumns: new[] { "Id", "OrganizationId" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WorkOrders_OrganizationId_Status_ScheduledStartUtc",
                table: "WorkOrders",
                columns: new[] { "OrganizationId", "Status", "ScheduledStartUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_WorkOrders_ServiceLocationId_OrganizationId",
                table: "WorkOrders",
                columns: new[] { "ServiceLocationId", "OrganizationId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WorkOrders");

            migrationBuilder.DropUniqueConstraint(
                name: "AK_ServiceLocations_Id_OrganizationId",
                table: "ServiceLocations");
        }
    }
}
