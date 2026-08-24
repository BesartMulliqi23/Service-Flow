using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ServiceFlow.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkOrderAssignments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddUniqueConstraint(
                name: "AK_WorkOrders_Id_OrganizationId",
                table: "WorkOrders",
                columns: new[] { "Id", "OrganizationId" });

            migrationBuilder.AddUniqueConstraint(
                name: "AK_AspNetUsers_Id_OrganizationId",
                table: "AspNetUsers",
                columns: new[] { "Id", "OrganizationId" });

            migrationBuilder.CreateTable(
                name: "WorkOrderAssignments",
                columns: table => new
                {
                    WorkOrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TechnicianId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    AssignedUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkOrderAssignments", x => new { x.WorkOrderId, x.TechnicianId });
                    table.ForeignKey(
                        name: "FK_WorkOrderAssignments_AspNetUsers_TechnicianId_OrganizationId",
                        columns: x => new { x.TechnicianId, x.OrganizationId },
                        principalTable: "AspNetUsers",
                        principalColumns: new[] { "Id", "OrganizationId" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkOrderAssignments_WorkOrders_WorkOrderId_OrganizationId",
                        columns: x => new { x.WorkOrderId, x.OrganizationId },
                        principalTable: "WorkOrders",
                        principalColumns: new[] { "Id", "OrganizationId" },
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WorkOrderAssignments_OrganizationId_TechnicianId",
                table: "WorkOrderAssignments",
                columns: new[] { "OrganizationId", "TechnicianId" });

            migrationBuilder.CreateIndex(
                name: "IX_WorkOrderAssignments_TechnicianId_OrganizationId",
                table: "WorkOrderAssignments",
                columns: new[] { "TechnicianId", "OrganizationId" });

            migrationBuilder.CreateIndex(
                name: "IX_WorkOrderAssignments_WorkOrderId_OrganizationId",
                table: "WorkOrderAssignments",
                columns: new[] { "WorkOrderId", "OrganizationId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WorkOrderAssignments");

            migrationBuilder.DropUniqueConstraint(
                name: "AK_WorkOrders_Id_OrganizationId",
                table: "WorkOrders");

            migrationBuilder.DropUniqueConstraint(
                name: "AK_AspNetUsers_Id_OrganizationId",
                table: "AspNetUsers");
        }
    }
}
