using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gestion.Api.Migrations
{
    /// <inheritdoc />
    public partial class EmpresaPersonalizacion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Direccion",
                table: "Empresas",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Empresas",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LogoUrl",
                table: "Empresas",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Nit",
                table: "Empresas",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RazonSocial",
                table: "Empresas",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SitioWeb",
                table: "Empresas",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Telefono",
                table: "Empresas",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Direccion",
                table: "Empresas");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "Empresas");

            migrationBuilder.DropColumn(
                name: "LogoUrl",
                table: "Empresas");

            migrationBuilder.DropColumn(
                name: "Nit",
                table: "Empresas");

            migrationBuilder.DropColumn(
                name: "RazonSocial",
                table: "Empresas");

            migrationBuilder.DropColumn(
                name: "SitioWeb",
                table: "Empresas");

            migrationBuilder.DropColumn(
                name: "Telefono",
                table: "Empresas");
        }
    }
}
