using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ServiceFlow.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddServiceLocations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddUniqueConstraint(
                name: "AK_Customers_Id_OrganizationId",
                table: "Customers",
                columns: new[] { "Id", "OrganizationId" });

            migrationBuilder.CreateTable(
                name: "ServiceLocations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CustomerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    AddressLine1 = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    AddressLine2 = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    City = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    PostalCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Country = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    AccessInstructions = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServiceLocations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ServiceLocations_Customers_CustomerId_OrganizationId",
                        columns: x => new { x.CustomerId, x.OrganizationId },
                        principalTable: "Customers",
                        principalColumns: new[] { "Id", "OrganizationId" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ServiceLocations_CustomerId_OrganizationId",
                table: "ServiceLocations",
                columns: new[] { "CustomerId", "OrganizationId" });

            migrationBuilder.CreateIndex(
                name: "IX_ServiceLocations_OrganizationId_CustomerId_IsActive_Name",
                table: "ServiceLocations",
                columns: new[] { "OrganizationId", "CustomerId", "IsActive", "Name" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ServiceLocations");

            migrationBuilder.DropUniqueConstraint(
                name: "AK_Customers_Id_OrganizationId",
                table: "Customers");
        }
    }
}
