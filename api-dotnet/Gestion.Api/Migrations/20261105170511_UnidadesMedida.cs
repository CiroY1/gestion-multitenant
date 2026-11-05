using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Gestion.Api.Migrations
{
    /// <inheritdoc />
    public partial class UnidadesMedida : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "UnidadMedidaId",
                table: "Productos",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "UnidadesMedida",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nombre = table.Column<string>(type: "text", nullable: false),
                    Abreviatura = table.Column<string>(type: "text", nullable: false),
                    TenantId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UnidadesMedida", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Productos_UnidadMedidaId",
                table: "Productos",
                column: "UnidadMedidaId");

            migrationBuilder.CreateIndex(
                name: "IX_UnidadesMedida_TenantId",
                table: "UnidadesMedida",
                column: "TenantId");

            migrationBuilder.AddForeignKey(
                name: "FK_Productos_UnidadesMedida_UnidadMedidaId",
                table: "Productos",
                column: "UnidadMedidaId",
                principalTable: "UnidadesMedida",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            // --- Backfill ---
            // 1) Unidades por defecto por empresa.
            migrationBuilder.Sql(@"
                INSERT INTO ""UnidadesMedida"" (""Nombre"", ""Abreviatura"", ""TenantId"")
                SELECT v.n, v.a, e.""Id""
                FROM ""Empresas"" e
                CROSS JOIN (VALUES ('Unidad','und'),('Kilogramo','kg'),('Litro','lt'),('Caja','cja')) AS v(n, a);");

            // 2) Productos existentes -> Unidad (und).
            migrationBuilder.Sql(@"
                UPDATE ""Productos"" p SET ""UnidadMedidaId"" = u.""Id""
                FROM ""UnidadesMedida"" u
                WHERE u.""TenantId"" = p.""TenantId"" AND u.""Abreviatura"" = 'und'
                  AND p.""UnidadMedidaId"" IS NULL;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Productos_UnidadesMedida_UnidadMedidaId",
                table: "Productos");

            migrationBuilder.DropTable(
                name: "UnidadesMedida");

            migrationBuilder.DropIndex(
                name: "IX_Productos_UnidadMedidaId",
                table: "Productos");

            migrationBuilder.DropColumn(
                name: "UnidadMedidaId",
                table: "Productos");
        }
    }
}
