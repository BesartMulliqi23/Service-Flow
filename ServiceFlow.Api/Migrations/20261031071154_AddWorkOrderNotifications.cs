using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ServiceFlow.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkOrderNotifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "WorkOrderNotifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WorkOrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RecipientUserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Message = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    ScheduledStartUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeduplicationKey = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    CreatedUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReadUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkOrderNotifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkOrderNotifications_AspNetUsers_RecipientUserId_OrganizationId",
                        columns: x => new { x.RecipientUserId, x.OrganizationId },
                        principalTable: "AspNetUsers",
                        principalColumns: new[] { "Id", "OrganizationId" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkOrderNotifications_WorkOrders_WorkOrderId_OrganizationId",
                        columns: x => new { x.WorkOrderId, x.OrganizationId },
                        principalTable: "WorkOrders",
                        principalColumns: new[] { "Id", "OrganizationId" },
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WorkOrderNotifications_OrganizationId_RecipientUserId_DeduplicationKey",
                table: "WorkOrderNotifications",
                columns: new[] { "OrganizationId", "RecipientUserId", "DeduplicationKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WorkOrderNotifications_OrganizationId_RecipientUserId_ReadUtc_CreatedUtc",
                table: "WorkOrderNotifications",
                columns: new[] { "OrganizationId", "RecipientUserId", "ReadUtc", "CreatedUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_WorkOrderNotifications_RecipientUserId_OrganizationId",
                table: "WorkOrderNotifications",
                columns: new[] { "RecipientUserId", "OrganizationId" });

            migrationBuilder.CreateIndex(
                name: "IX_WorkOrderNotifications_WorkOrderId_OrganizationId",
                table: "WorkOrderNotifications",
                columns: new[] { "WorkOrderId", "OrganizationId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WorkOrderNotifications");
        }
    }
}
