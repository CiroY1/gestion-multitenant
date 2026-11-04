using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Gestion.Api.Migrations
{
    /// <inheritdoc />
    public partial class EstadosConsecutivos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Estado",
                table: "Remisiones",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaAnulacion",
                table: "Remisiones",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaConfirmacion",
                table: "Remisiones",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Numero",
                table: "Remisiones",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "Estado",
                table: "Recepciones",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaAnulacion",
                table: "Recepciones",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaConfirmacion",
                table: "Recepciones",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Numero",
                table: "Recepciones",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "Consecutivos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TenantId = table.Column<string>(type: "text", nullable: false),
                    TipoDocumento = table.Column<string>(type: "text", nullable: false),
                    UltimoNumero = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Consecutivos", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Remisiones_TenantId_Numero",
                table: "Remisiones",
                columns: new[] { "TenantId", "Numero" });

            migrationBuilder.CreateIndex(
                name: "IX_Recepciones_TenantId_Numero",
                table: "Recepciones",
                columns: new[] { "TenantId", "Numero" });

            migrationBuilder.CreateIndex(
                name: "IX_Consecutivos_TenantId_TipoDocumento",
                table: "Consecutivos",
                columns: new[] { "TenantId", "TipoDocumento" },
                unique: true);

            // --- Backfill de datos existentes ---
            // Los documentos creados con la lógica anterior YA movieron stock, así que
            // se marcan como Confirmado, se les asigna número consecutivo por empresa y
            // orden de creación, y se siembran los contadores con el máximo usado.

            migrationBuilder.Sql(@"
                WITH numeradas AS (
                    SELECT ""Id"",
                           ROW_NUMBER() OVER (PARTITION BY ""TenantId"" ORDER BY ""Id"") AS rn
                    FROM ""Recepciones""
                )
                UPDATE ""Recepciones"" r
                SET ""Numero"" = 'REC-' || LPAD(n.rn::text, 4, '0'),
                    ""Estado"" = 1,
                    ""FechaConfirmacion"" = r.""Fecha""
                FROM numeradas n
                WHERE r.""Id"" = n.""Id"";");

            migrationBuilder.Sql(@"
                WITH numeradas AS (
                    SELECT ""Id"",
                           ROW_NUMBER() OVER (PARTITION BY ""TenantId"" ORDER BY ""Id"") AS rn
                    FROM ""Remisiones""
                )
                UPDATE ""Remisiones"" r
                SET ""Numero"" = 'REM-' || LPAD(n.rn::text, 4, '0'),
                    ""Estado"" = 1,
                    ""FechaConfirmacion"" = r.""Fecha""
                FROM numeradas n
                WHERE r.""Id"" = n.""Id"";");

            migrationBuilder.Sql(@"
                INSERT INTO ""Consecutivos"" (""TenantId"", ""TipoDocumento"", ""UltimoNumero"")
                SELECT ""TenantId"", 'REC', COUNT(*) FROM ""Recepciones"" GROUP BY ""TenantId"";");

            migrationBuilder.Sql(@"
                INSERT INTO ""Consecutivos"" (""TenantId"", ""TipoDocumento"", ""UltimoNumero"")
                SELECT ""TenantId"", 'REM', COUNT(*) FROM ""Remisiones"" GROUP BY ""TenantId"";");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Consecutivos");

            migrationBuilder.DropIndex(
                name: "IX_Remisiones_TenantId_Numero",
                table: "Remisiones");

            migrationBuilder.DropIndex(
                name: "IX_Recepciones_TenantId_Numero",
                table: "Recepciones");

            migrationBuilder.DropColumn(
                name: "Estado",
                table: "Remisiones");

            migrationBuilder.DropColumn(
                name: "FechaAnulacion",
                table: "Remisiones");

            migrationBuilder.DropColumn(
                name: "FechaConfirmacion",
                table: "Remisiones");

            migrationBuilder.DropColumn(
                name: "Numero",
                table: "Remisiones");

            migrationBuilder.DropColumn(
                name: "Estado",
                table: "Recepciones");

            migrationBuilder.DropColumn(
                name: "FechaAnulacion",
                table: "Recepciones");

            migrationBuilder.DropColumn(
                name: "FechaConfirmacion",
                table: "Recepciones");

            migrationBuilder.DropColumn(
                name: "Numero",
                table: "Recepciones");
        }
    }
}
