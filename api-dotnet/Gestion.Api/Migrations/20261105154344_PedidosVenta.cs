using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Gestion.Api.Migrations
{
    /// <inheritdoc />
    public partial class PedidosVenta : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PedidoVentaLineaId",
                table: "RemisionLineas",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PedidoVentaId",
                table: "Remisiones",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PedidosVenta",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Numero = table.Column<string>(type: "text", nullable: false),
                    Cliente = table.Column<string>(type: "text", nullable: false),
                    Observaciones = table.Column<string>(type: "text", nullable: true),
                    Fecha = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Estado = table.Column<int>(type: "integer", nullable: false),
                    FechaAprobacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TenantId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PedidosVenta", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PedidoVentaLineas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PedidoVentaId = table.Column<int>(type: "integer", nullable: false),
                    ProductoId = table.Column<int>(type: "integer", nullable: false),
                    Cantidad = table.Column<int>(type: "integer", nullable: false),
                    PrecioUnitario = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    CantidadDespachada = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PedidoVentaLineas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PedidoVentaLineas_PedidosVenta_PedidoVentaId",
                        column: x => x.PedidoVentaId,
                        principalTable: "PedidosVenta",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PedidoVentaLineas_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RemisionLineas_PedidoVentaLineaId",
                table: "RemisionLineas",
                column: "PedidoVentaLineaId");

            migrationBuilder.CreateIndex(
                name: "IX_Remisiones_PedidoVentaId",
                table: "Remisiones",
                column: "PedidoVentaId");

            migrationBuilder.CreateIndex(
                name: "IX_PedidosVenta_TenantId",
                table: "PedidosVenta",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_PedidosVenta_TenantId_Numero",
                table: "PedidosVenta",
                columns: new[] { "TenantId", "Numero" });

            migrationBuilder.CreateIndex(
                name: "IX_PedidoVentaLineas_PedidoVentaId",
                table: "PedidoVentaLineas",
                column: "PedidoVentaId");

            migrationBuilder.CreateIndex(
                name: "IX_PedidoVentaLineas_ProductoId",
                table: "PedidoVentaLineas",
                column: "ProductoId");

            migrationBuilder.AddForeignKey(
                name: "FK_Remisiones_PedidosVenta_PedidoVentaId",
                table: "Remisiones",
                column: "PedidoVentaId",
                principalTable: "PedidosVenta",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_RemisionLineas_PedidoVentaLineas_PedidoVentaLineaId",
                table: "RemisionLineas",
                column: "PedidoVentaLineaId",
                principalTable: "PedidoVentaLineas",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Remisiones_PedidosVenta_PedidoVentaId",
                table: "Remisiones");

            migrationBuilder.DropForeignKey(
                name: "FK_RemisionLineas_PedidoVentaLineas_PedidoVentaLineaId",
                table: "RemisionLineas");

            migrationBuilder.DropTable(
                name: "PedidoVentaLineas");

            migrationBuilder.DropTable(
                name: "PedidosVenta");

            migrationBuilder.DropIndex(
                name: "IX_RemisionLineas_PedidoVentaLineaId",
                table: "RemisionLineas");

            migrationBuilder.DropIndex(
                name: "IX_Remisiones_PedidoVentaId",
                table: "Remisiones");

            migrationBuilder.DropColumn(
                name: "PedidoVentaLineaId",
                table: "RemisionLineas");

            migrationBuilder.DropColumn(
                name: "PedidoVentaId",
                table: "Remisiones");
        }
    }
}
