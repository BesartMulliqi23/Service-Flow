using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ServiceFlow.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDashboardReportingIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_WorkOrders_OrganizationId_CompletedUtc",
                table: "WorkOrders",
                columns: new[] { "OrganizationId", "CompletedUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_WorkOrderMaterials_OrganizationId_AddedUtc",
                table: "WorkOrderMaterials",
                columns: new[] { "OrganizationId", "AddedUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_WorkOrders_OrganizationId_CompletedUtc",
                table: "WorkOrders");

            migrationBuilder.DropIndex(
                name: "IX_WorkOrderMaterials_OrganizationId_AddedUtc",
                table: "WorkOrderMaterials");
        }
    }
}
