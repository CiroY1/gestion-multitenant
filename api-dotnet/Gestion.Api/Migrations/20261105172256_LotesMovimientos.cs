using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gestion.Api.Migrations
{
    /// <inheritdoc />
    public partial class LotesMovimientos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "LoteId",
                table: "RecepcionLineas",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LoteId",
                table: "MovimientosStock",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_RecepcionLineas_LoteId",
                table: "RecepcionLineas",
                column: "LoteId");

            migrationBuilder.CreateIndex(
                name: "IX_MovimientosStock_LoteId",
                table: "MovimientosStock",
                column: "LoteId");

            migrationBuilder.AddForeignKey(
                name: "FK_MovimientosStock_Lotes_LoteId",
                table: "MovimientosStock",
                column: "LoteId",
                principalTable: "Lotes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_RecepcionLineas_Lotes_LoteId",
                table: "RecepcionLineas",
                column: "LoteId",
                principalTable: "Lotes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MovimientosStock_Lotes_LoteId",
                table: "MovimientosStock");

            migrationBuilder.DropForeignKey(
                name: "FK_RecepcionLineas_Lotes_LoteId",
                table: "RecepcionLineas");

            migrationBuilder.DropIndex(
                name: "IX_RecepcionLineas_LoteId",
                table: "RecepcionLineas");

            migrationBuilder.DropIndex(
                name: "IX_MovimientosStock_LoteId",
                table: "MovimientosStock");

            migrationBuilder.DropColumn(
                name: "LoteId",
                table: "RecepcionLineas");

            migrationBuilder.DropColumn(
                name: "LoteId",
                table: "MovimientosStock");
        }
    }
}
