using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ServiceFlow.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkOrderExecutionHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedUtc",
                table: "WorkOrders",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "StartedUtc",
                table: "WorkOrders",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "WorkOrderStatusChanges",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WorkOrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ChangedByUserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PreviousStatus = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    NewStatus = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Note = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    ChangedUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkOrderStatusChanges", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkOrderStatusChanges_AspNetUsers_ChangedByUserId_OrganizationId",
                        columns: x => new { x.ChangedByUserId, x.OrganizationId },
                        principalTable: "AspNetUsers",
                        principalColumns: new[] { "Id", "OrganizationId" },
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WorkOrderStatusChanges_WorkOrders_WorkOrderId_OrganizationId",
                        columns: x => new { x.WorkOrderId, x.OrganizationId },
                        principalTable: "WorkOrders",
                        principalColumns: new[] { "Id", "OrganizationId" },
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WorkOrderStatusChanges_ChangedByUserId_OrganizationId",
                table: "WorkOrderStatusChanges",
                columns: new[] { "ChangedByUserId", "OrganizationId" });

            migrationBuilder.CreateIndex(
                name: "IX_WorkOrderStatusChanges_OrganizationId_WorkOrderId_ChangedUtc",
                table: "WorkOrderStatusChanges",
                columns: new[] { "OrganizationId", "WorkOrderId", "ChangedUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_WorkOrderStatusChanges_WorkOrderId_OrganizationId",
                table: "WorkOrderStatusChanges",
                columns: new[] { "WorkOrderId", "OrganizationId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WorkOrderStatusChanges");

            migrationBuilder.DropColumn(
                name: "CompletedUtc",
                table: "WorkOrders");

            migrationBuilder.DropColumn(
                name: "StartedUtc",
                table: "WorkOrders");
        }
    }
}
