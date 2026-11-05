using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Gestion.Api.Migrations
{
    /// <inheritdoc />
    public partial class OrdenesCompra : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "OrdenCompraLineaId",
                table: "RecepcionLineas",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OrdenCompraId",
                table: "Recepciones",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "OrdenesCompra",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Numero = table.Column<string>(type: "text", nullable: false),
                    Proveedor = table.Column<string>(type: "text", nullable: false),
                    Observaciones = table.Column<string>(type: "text", nullable: true),
                    Fecha = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Estado = table.Column<int>(type: "integer", nullable: false),
                    FechaAprobacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TenantId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrdenesCompra", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OrdenCompraLineas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrdenCompraId = table.Column<int>(type: "integer", nullable: false),
                    ProductoId = table.Column<int>(type: "integer", nullable: false),
                    Cantidad = table.Column<int>(type: "integer", nullable: false),
                    CostoUnitario = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    CantidadRecibida = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrdenCompraLineas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrdenCompraLineas_OrdenesCompra_OrdenCompraId",
                        column: x => x.OrdenCompraId,
                        principalTable: "OrdenesCompra",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OrdenCompraLineas_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RecepcionLineas_OrdenCompraLineaId",
                table: "RecepcionLineas",
                column: "OrdenCompraLineaId");

            migrationBuilder.CreateIndex(
                name: "IX_Recepciones_OrdenCompraId",
                table: "Recepciones",
                column: "OrdenCompraId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenCompraLineas_OrdenCompraId",
                table: "OrdenCompraLineas",
                column: "OrdenCompraId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenCompraLineas_ProductoId",
                table: "OrdenCompraLineas",
                column: "ProductoId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesCompra_TenantId",
                table: "OrdenesCompra",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesCompra_TenantId_Numero",
                table: "OrdenesCompra",
                columns: new[] { "TenantId", "Numero" });

            migrationBuilder.AddForeignKey(
                name: "FK_Recepciones_OrdenesCompra_OrdenCompraId",
                table: "Recepciones",
                column: "OrdenCompraId",
                principalTable: "OrdenesCompra",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_RecepcionLineas_OrdenCompraLineas_OrdenCompraLineaId",
                table: "RecepcionLineas",
                column: "OrdenCompraLineaId",
                principalTable: "OrdenCompraLineas",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Recepciones_OrdenesCompra_OrdenCompraId",
                table: "Recepciones");

            migrationBuilder.DropForeignKey(
                name: "FK_RecepcionLineas_OrdenCompraLineas_OrdenCompraLineaId",
                table: "RecepcionLineas");

            migrationBuilder.DropTable(
                name: "OrdenCompraLineas");

            migrationBuilder.DropTable(
                name: "OrdenesCompra");

            migrationBuilder.DropIndex(
                name: "IX_RecepcionLineas_OrdenCompraLineaId",
                table: "RecepcionLineas");

            migrationBuilder.DropIndex(
                name: "IX_Recepciones_OrdenCompraId",
                table: "Recepciones");

            migrationBuilder.DropColumn(
                name: "OrdenCompraLineaId",
                table: "RecepcionLineas");

            migrationBuilder.DropColumn(
                name: "OrdenCompraId",
                table: "Recepciones");
        }
    }
}
