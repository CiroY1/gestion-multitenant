using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Gestion.Api.Migrations
{
    /// <inheritdoc />
    public partial class MultiBodega : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Bodegas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nombre = table.Column<string>(type: "text", nullable: false),
                    Codigo = table.Column<string>(type: "text", nullable: true),
                    Activa = table.Column<bool>(type: "boolean", nullable: false),
                    TenantId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Bodegas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ExistenciaBodegas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProductoId = table.Column<int>(type: "integer", nullable: false),
                    BodegaId = table.Column<int>(type: "integer", nullable: false),
                    Stock = table.Column<int>(type: "integer", nullable: false),
                    TenantId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExistenciaBodegas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExistenciaBodegas_Bodegas_BodegaId",
                        column: x => x.BodegaId,
                        principalTable: "Bodegas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ExistenciaBodegas_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Bodegas_TenantId",
                table: "Bodegas",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_ExistenciaBodegas_BodegaId",
                table: "ExistenciaBodegas",
                column: "BodegaId");

            migrationBuilder.CreateIndex(
                name: "IX_ExistenciaBodegas_ProductoId",
                table: "ExistenciaBodegas",
                column: "ProductoId");

            migrationBuilder.CreateIndex(
                name: "IX_ExistenciaBodegas_TenantId_ProductoId_BodegaId",
                table: "ExistenciaBodegas",
                columns: new[] { "TenantId", "ProductoId", "BodegaId" },
                unique: true);

            // --- Backfill ---
            // 1) Una bodega "Principal" por empresa (tenant).
            migrationBuilder.Sql(@"
                INSERT INTO ""Bodegas"" (""Nombre"", ""Codigo"", ""Activa"", ""TenantId"")
                SELECT 'Principal', 'PRI', true, ""Id"" FROM ""Empresas"";");

            // 2) Llevar el stock actual de cada producto a la bodega Principal de su empresa.
            migrationBuilder.Sql(@"
                INSERT INTO ""ExistenciaBodegas"" (""ProductoId"", ""BodegaId"", ""Stock"", ""TenantId"")
                SELECT p.""Id"", b.""Id"", p.""Stock"", p.""TenantId""
                FROM ""Productos"" p
                JOIN ""Bodegas"" b ON b.""TenantId"" = p.""TenantId"" AND b.""Codigo"" = 'PRI';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ExistenciaBodegas");

            migrationBuilder.DropTable(
                name: "Bodegas");
        }
    }
}
