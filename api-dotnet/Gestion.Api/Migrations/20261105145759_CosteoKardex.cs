using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gestion.Api.Migrations
{
    /// <inheritdoc />
    public partial class CosteoKardex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "CostoPromedio",
                table: "Productos",
                type: "numeric(12,2)",
                precision: 12,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "Concepto",
                table: "MovimientosStock",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "CostoPromedio",
                table: "MovimientosStock",
                type: "numeric(12,2)",
                precision: 12,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "CostoUnitario",
                table: "MovimientosStock",
                type: "numeric(12,2)",
                precision: 12,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "DocumentoNumero",
                table: "MovimientosStock",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DocumentoTipo",
                table: "MovimientosStock",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SaldoCantidad",
                table: "MovimientosStock",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_MovimientosStock_TenantId_ProductoId",
                table: "MovimientosStock",
                columns: new[] { "TenantId", "ProductoId" });

            // --- Backfill ---
            // 1) Costo promedio inicial = promedio ponderado de las recepciones confirmadas.
            migrationBuilder.Sql(@"
                UPDATE ""Productos"" p
                SET ""CostoPromedio"" = sub.prom
                FROM (
                    SELECT l.""ProductoId"",
                           SUM(l.""Cantidad"" * l.""CostoUnitario"")::numeric
                             / NULLIF(SUM(l.""Cantidad""), 0) AS prom
                    FROM ""RecepcionLineas"" l
                    JOIN ""Recepciones"" r ON r.""Id"" = l.""RecepcionId"" AND r.""Estado"" = 1
                    GROUP BY l.""ProductoId""
                ) sub
                WHERE p.""Id"" = sub.""ProductoId"";");

            // 2) Kardex histórico: reconstruye el saldo de unidades corrido por producto.
            migrationBuilder.Sql(@"
                WITH ordenado AS (
                    SELECT ""Id"",
                           SUM(CASE WHEN ""Tipo"" = 1 THEN ""Cantidad"" ELSE -""Cantidad"" END)
                             OVER (PARTITION BY ""ProductoId"" ORDER BY ""Fecha"", ""Id""
                                   ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS saldo
                    FROM ""MovimientosStock""
                )
                UPDATE ""MovimientosStock"" m
                SET ""SaldoCantidad"" = o.saldo,
                    ""DocumentoTipo"" = 'HIST',
                    ""Concepto"" = 'Movimiento histórico'
                FROM ordenado o
                WHERE m.""Id"" = o.""Id"";");

            // 3) Costo histórico aproximado = costo promedio actual del producto.
            migrationBuilder.Sql(@"
                UPDATE ""MovimientosStock"" m
                SET ""CostoUnitario"" = p.""CostoPromedio"",
                    ""CostoPromedio"" = p.""CostoPromedio""
                FROM ""Productos"" p
                WHERE m.""ProductoId"" = p.""Id"";");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MovimientosStock_TenantId_ProductoId",
                table: "MovimientosStock");

            migrationBuilder.DropColumn(
                name: "CostoPromedio",
                table: "Productos");

            migrationBuilder.DropColumn(
                name: "Concepto",
                table: "MovimientosStock");

            migrationBuilder.DropColumn(
                name: "CostoPromedio",
                table: "MovimientosStock");

            migrationBuilder.DropColumn(
                name: "CostoUnitario",
                table: "MovimientosStock");

            migrationBuilder.DropColumn(
                name: "DocumentoNumero",
                table: "MovimientosStock");

            migrationBuilder.DropColumn(
                name: "DocumentoTipo",
                table: "MovimientosStock");

            migrationBuilder.DropColumn(
                name: "SaldoCantidad",
                table: "MovimientosStock");
        }
    }
}
