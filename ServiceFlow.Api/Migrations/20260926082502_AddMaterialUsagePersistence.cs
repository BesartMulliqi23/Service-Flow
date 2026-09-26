using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ServiceFlow.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMaterialUsagePersistence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Materials",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Sku = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    UnitOfMeasure = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    DefaultUnitCost = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Materials", x => x.Id);
                    table.UniqueConstraint("AK_Materials_Id_OrganizationId", x => new { x.Id, x.OrganizationId });
                    table.ForeignKey(
                        name: "FK_Materials_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WorkOrderMaterials",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WorkOrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MaterialId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MaterialName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    UnitOfMeasure = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    UnitCost = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    AddedUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkOrderMaterials", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkOrderMaterials_Materials_MaterialId_OrganizationId",
                        columns: x => new { x.MaterialId, x.OrganizationId },
                        principalTable: "Materials",
                        principalColumns: new[] { "Id", "OrganizationId" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkOrderMaterials_WorkOrders_WorkOrderId_OrganizationId",
                        columns: x => new { x.WorkOrderId, x.OrganizationId },
                        principalTable: "WorkOrders",
                        principalColumns: new[] { "Id", "OrganizationId" },
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Materials_OrganizationId_IsActive_Name",
                table: "Materials",
                columns: new[] { "OrganizationId", "IsActive", "Name" });

            migrationBuilder.CreateIndex(
                name: "IX_Materials_OrganizationId_Sku",
                table: "Materials",
                columns: new[] { "OrganizationId", "Sku" },
                unique: true,
                filter: "[Sku] IS NOT NULL AND [IsActive] = 1");

            migrationBuilder.CreateIndex(
                name: "IX_WorkOrderMaterials_MaterialId_OrganizationId",
                table: "WorkOrderMaterials",
                columns: new[] { "MaterialId", "OrganizationId" });

            migrationBuilder.CreateIndex(
                name: "IX_WorkOrderMaterials_OrganizationId_WorkOrderId_MaterialId",
                table: "WorkOrderMaterials",
                columns: new[] { "OrganizationId", "WorkOrderId", "MaterialId" });

            migrationBuilder.CreateIndex(
                name: "IX_WorkOrderMaterials_WorkOrderId_OrganizationId",
                table: "WorkOrderMaterials",
                columns: new[] { "WorkOrderId", "OrganizationId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WorkOrderMaterials");

            migrationBuilder.DropTable(
                name: "Materials");
        }
    }
}
