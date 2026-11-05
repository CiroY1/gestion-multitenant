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
  {
    id: '002_spa_citas',
    sql: `
      CREATE TABLE IF NOT EXISTS "SpaCitas" (
        "Id"             serial PRIMARY KEY,
        "TenantId"       text NOT NULL,
        "ServicioId"     integer NOT NULL,
        "ServicioNombre" text NOT NULL,
        "ClienteId"      integer NULL,
        "ClienteNombre"  text NOT NULL,
        "BebeNombre"     text NOT NULL DEFAULT '',
        "FechaHora"      timestamptz NOT NULL,
        "Estado"         text NOT NULL DEFAULT 'Programada',
        "Notas"          text NOT NULL DEFAULT '',
        "CreadoEn"       timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "IX_SpaCitas_TenantId"
        ON "SpaCitas" ("TenantId");
      CREATE INDEX IF NOT EXISTS "IX_SpaCitas_Agenda"
        ON "SpaCitas" ("TenantId", "FechaHora");
    `,
  },
  {
    id: '003_spa_trabajadores',
    sql: `
      CREATE TABLE IF NOT EXISTS "SpaTrabajadores" (
        "Id"       serial PRIMARY KEY,
        "TenantId" text NOT NULL,
        "Nombre"   text NOT NULL,
        "Rol"      text NOT NULL DEFAULT '',
        "Activo"   boolean NOT NULL DEFAULT true,
        "CreadoEn" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "IX_SpaTrabajadores_TenantId"
        ON "SpaTrabajadores" ("TenantId");
    `,
  },
  {
    id: '004_spa_tareas',
    sql: `
      CREATE TABLE IF NOT EXISTS "SpaTareas" (
        "Id"               serial PRIMARY KEY,
        "TenantId"         text NOT NULL,
        "Titulo"           text NOT NULL,
        "TrabajadorId"     integer NOT NULL,
        "TrabajadorNombre" text NOT NULL,
        "FechaHora"        timestamptz NOT NULL,
        "Estado"           text NOT NULL DEFAULT 'Pendiente',
        "Notas"            text NOT NULL DEFAULT '',
        "CreadoEn"         timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "IX_SpaTareas_Agenda"
        ON "SpaTareas" ("TenantId", "FechaHora");
      CREATE INDEX IF NOT EXISTS "IX_SpaTareas_Trabajador"
        ON "SpaTareas" ("TenantId", "TrabajadorId");
    `,
  },
  {
    id: '005_spa_trabajador_email',
    sql: `
      ALTER TABLE "SpaTrabajadores"
        ADD COLUMN IF NOT EXISTS "Email" text NOT NULL DEFAULT '';
    `,
  },
  {
    id: '006_spa_cita_terapeuta',
    sql: `
      ALTER TABLE "SpaCitas"
        ADD COLUMN IF NOT EXISTS "TrabajadorId" integer NULL,
        ADD COLUMN IF NOT EXISTS "TrabajadorNombre" text NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS "DuracionMin" integer NOT NULL DEFAULT 30;
    `,
  },
  {
    id: '007_spa_bebes',
    sql: `
      CREATE TABLE IF NOT EXISTS "SpaBebes" (
        "Id"              serial PRIMARY KEY,
        "TenantId"        text NOT NULL,
        "Nombre"          text NOT NULL,
        "ClienteId"       integer NULL,
        "ClienteNombre"   text NOT NULL DEFAULT '',
        "FechaNacimiento" date NOT NULL,
        "Peso"            numeric(5,2) NULL,
        "Alergias"        text NOT NULL DEFAULT '',
        "Notas"           text NOT NULL DEFAULT '',
        "CreadoEn"        timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "IX_SpaBebes_TenantId"
        ON "SpaBebes" ("TenantId");
    `,
  },
  {
    id: '008_spa_salas',
    sql: `
      CREATE TABLE IF NOT EXISTS "SpaSalas" (
        "Id"       serial PRIMARY KEY,
        "TenantId" text NOT NULL,
        "Nombre"   text NOT NULL,
        "Activa"   boolean NOT NULL DEFAULT true,
        "CreadoEn" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "IX_SpaSalas_TenantId"
        ON "SpaSalas" ("TenantId");
      ALTER TABLE "SpaCitas"
        ADD COLUMN IF NOT EXISTS "SalaId" integer NULL,
        ADD COLUMN IF NOT EXISTS "SalaNombre" text NOT NULL DEFAULT '';
    `,
  },
]
