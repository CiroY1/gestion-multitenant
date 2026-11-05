using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Gestion.Api.Migrations
{
    /// <inheritdoc />
    public partial class Traslados : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Traslados",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Numero = table.Column<string>(type: "text", nullable: false),
                    BodegaOrigenId = table.Column<int>(type: "integer", nullable: false),
                    BodegaDestinoId = table.Column<int>(type: "integer", nullable: false),
                    Observaciones = table.Column<string>(type: "text", nullable: true),
                    Fecha = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Estado = table.Column<int>(type: "integer", nullable: false),
                    FechaConfirmacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FechaAnulacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TenantId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Traslados", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Traslados_Bodegas_BodegaDestinoId",
                        column: x => x.BodegaDestinoId,
                        principalTable: "Bodegas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Traslados_Bodegas_BodegaOrigenId",
                        column: x => x.BodegaOrigenId,
                        principalTable: "Bodegas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TrasladoLineas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TrasladoId = table.Column<int>(type: "integer", nullable: false),
                    ProductoId = table.Column<int>(type: "integer", nullable: false),
                    Cantidad = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrasladoLineas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TrasladoLineas_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TrasladoLineas_Traslados_TrasladoId",
                        column: x => x.TrasladoId,
                        principalTable: "Traslados",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TrasladoLineas_ProductoId",
                table: "TrasladoLineas",
                column: "ProductoId");

            migrationBuilder.CreateIndex(
                name: "IX_TrasladoLineas_TrasladoId",
                table: "TrasladoLineas",
                column: "TrasladoId");

            migrationBuilder.CreateIndex(
                name: "IX_Traslados_BodegaDestinoId",
                table: "Traslados",
                column: "BodegaDestinoId");

            migrationBuilder.CreateIndex(
                name: "IX_Traslados_BodegaOrigenId",
                table: "Traslados",
                column: "BodegaOrigenId");

            migrationBuilder.CreateIndex(
                name: "IX_Traslados_TenantId",
                table: "Traslados",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Traslados_TenantId_Numero",
                table: "Traslados",
                columns: new[] { "TenantId", "Numero" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TrasladoLineas");

            migrationBuilder.DropTable(
                name: "Traslados");
        }
    }
}
