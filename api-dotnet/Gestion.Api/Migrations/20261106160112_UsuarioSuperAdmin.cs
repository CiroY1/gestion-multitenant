using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gestion.Api.Migrations
{
    /// <inheritdoc />
    public partial class UsuarioSuperAdmin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "EsSuperAdmin",
                table: "Usuarios",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EsSuperAdmin",
                table: "Usuarios");
        }
    }
}
