using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ServiceFlow.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkOrderNotes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "WorkOrderNotes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WorkOrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    CreatedUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkOrderNotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkOrderNotes_AspNetUsers_CreatedByUserId_OrganizationId",
                        columns: x => new { x.CreatedByUserId, x.OrganizationId },
                        principalTable: "AspNetUsers",
                        principalColumns: new[] { "Id", "OrganizationId" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkOrderNotes_WorkOrders_WorkOrderId_OrganizationId",
                        columns: x => new { x.WorkOrderId, x.OrganizationId },
                        principalTable: "WorkOrders",
                        principalColumns: new[] { "Id", "OrganizationId" },
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WorkOrderNotes_CreatedByUserId_OrganizationId",
                table: "WorkOrderNotes",
                columns: new[] { "CreatedByUserId", "OrganizationId" });

            migrationBuilder.CreateIndex(
                name: "IX_WorkOrderNotes_OrganizationId_WorkOrderId_CreatedUtc",
                table: "WorkOrderNotes",
                columns: new[] { "OrganizationId", "WorkOrderId", "CreatedUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_WorkOrderNotes_WorkOrderId_OrganizationId",
                table: "WorkOrderNotes",
                columns: new[] { "WorkOrderId", "OrganizationId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WorkOrderNotes");
        }
    }
}
