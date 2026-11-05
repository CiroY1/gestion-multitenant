/**
 * Migraciones propias de NestJS. Nest es dueño de su dominio (spa), así que
 * crea y versiona sus propias tablas en la base Neon compartida. Se aplican en
 * orden y se registran en "NestMigrations" para no repetirlas.
 *
 * Convención de nombres en PascalCase entre comillas, igual que las tablas que
 * genera EF Core en el backend .NET, para mantener un estilo único en la base.
 */
export interface Migracion {
  id: string
  sql: string
}

export const MIGRACIONES: Migracion[] = [
  {
    id: '001_spa_servicios',
    sql: `
      CREATE TABLE IF NOT EXISTS "SpaServicios" (
        "Id"          serial PRIMARY KEY,
        "TenantId"    text NOT NULL,
        "Nombre"      text NOT NULL,
        "Descripcion" text NOT NULL DEFAULT '',
        "DuracionMin" integer NOT NULL DEFAULT 30,
        "Precio"      numeric(12,2) NOT NULL DEFAULT 0,
        "Activo"      boolean NOT NULL DEFAULT true,
        "CreadoEn"    timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "IX_SpaServicios_TenantId"
        ON "SpaServicios" ("TenantId");
    `,
  },
]
