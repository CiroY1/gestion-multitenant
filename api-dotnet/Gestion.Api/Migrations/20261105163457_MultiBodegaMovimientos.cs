using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gestion.Api.Migrations
{
    /// <inheritdoc />
    public partial class MultiBodegaMovimientos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BodegaId",
                table: "Remisiones",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BodegaId",
                table: "Recepciones",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BodegaId",
                table: "Notas",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BodegaId",
                table: "MovimientosStock",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BodegaId",
                table: "Ajustes",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Remisiones_BodegaId",
                table: "Remisiones",
                column: "BodegaId");

            migrationBuilder.CreateIndex(
                name: "IX_Recepciones_BodegaId",
                table: "Recepciones",
                column: "BodegaId");

            migrationBuilder.CreateIndex(
                name: "IX_Notas_BodegaId",
                table: "Notas",
                column: "BodegaId");

            migrationBuilder.CreateIndex(
                name: "IX_MovimientosStock_BodegaId",
                table: "MovimientosStock",
                column: "BodegaId");

            migrationBuilder.CreateIndex(
                name: "IX_Ajustes_BodegaId",
                table: "Ajustes",
                column: "BodegaId");

            migrationBuilder.AddForeignKey(
                name: "FK_Ajustes_Bodegas_BodegaId",
                table: "Ajustes",
                column: "BodegaId",
                principalTable: "Bodegas",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_MovimientosStock_Bodegas_BodegaId",
                table: "MovimientosStock",
                column: "BodegaId",
                principalTable: "Bodegas",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Notas_Bodegas_BodegaId",
                table: "Notas",
                column: "BodegaId",
                principalTable: "Bodegas",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Recepciones_Bodegas_BodegaId",
                table: "Recepciones",
                column: "BodegaId",
                principalTable: "Bodegas",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Remisiones_Bodegas_BodegaId",
                table: "Remisiones",
                column: "BodegaId",
                principalTable: "Bodegas",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            // --- Backfill: asignar la bodega Principal del tenant a los registros existentes. ---
            foreach (var tabla in new[] { "MovimientosStock", "Recepciones", "Remisiones", "Ajustes", "Notas" })
            {
                migrationBuilder.Sql($@"
                    UPDATE ""{tabla}"" x SET ""BodegaId"" = b.""Id""
                    FROM ""Bodegas"" b
                    WHERE b.""TenantId"" = x.""TenantId"" AND b.""Codigo"" = 'PRI'
                      AND x.""BodegaId"" IS NULL;");
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Ajustes_Bodegas_BodegaId",
                table: "Ajustes");

            migrationBuilder.DropForeignKey(
                name: "FK_MovimientosStock_Bodegas_BodegaId",
                table: "MovimientosStock");

            migrationBuilder.DropForeignKey(
                name: "FK_Notas_Bodegas_BodegaId",
                table: "Notas");

            migrationBuilder.DropForeignKey(
                name: "FK_Recepciones_Bodegas_BodegaId",
                table: "Recepciones");

            migrationBuilder.DropForeignKey(
                name: "FK_Remisiones_Bodegas_BodegaId",
                table: "Remisiones");

            migrationBuilder.DropIndex(
                name: "IX_Remisiones_BodegaId",
                table: "Remisiones");

            migrationBuilder.DropIndex(
                name: "IX_Recepciones_BodegaId",
                table: "Recepciones");

            migrationBuilder.DropIndex(
                name: "IX_Notas_BodegaId",
                table: "Notas");

            migrationBuilder.DropIndex(
                name: "IX_MovimientosStock_BodegaId",
                table: "MovimientosStock");

            migrationBuilder.DropIndex(
                name: "IX_Ajustes_BodegaId",
                table: "Ajustes");

            migrationBuilder.DropColumn(
                name: "BodegaId",
                table: "Remisiones");

            migrationBuilder.DropColumn(
                name: "BodegaId",
                table: "Recepciones");

            migrationBuilder.DropColumn(
                name: "BodegaId",
                table: "Notas");

            migrationBuilder.DropColumn(
                name: "BodegaId",
                table: "MovimientosStock");

            migrationBuilder.DropColumn(
                name: "BodegaId",
                table: "Ajustes");
        }
    }
}
