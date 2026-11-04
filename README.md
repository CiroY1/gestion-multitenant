# Plataforma de Gestión Multi-Tenant

![Angular](https://img.shields.io/badge/Angular-21-DD0031?logo=angular&logoColor=white)
![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)

Panel de administración **SaaS multi-tenant**: un único frontend en Angular que
integra **dos backends independientes** (.NET y NestJS) sobre PostgreSQL (Neon),
con **módulos activables por empresa** y autenticación JWT compartida.

> Proyecto en construcción. Ver [Roadmap](#roadmap).

---

## 🏗️ Arquitectura

Un mismo panel se comporta distinto según la empresa (tenant) del usuario: cada
empresa tiene activados ciertos módulos, y los datos se aíslan por `tenant_id`.

```
            ┌───────────────────────────┐
            │     Frontend (Angular)     │
            │   Panel único — Reback     │
            │  menú según módulos del     │
            │     tenant del usuario      │
            └────────────┬──────────────┘
                 │                 │
        módulo Inventario   módulo Spa
                 │                 │
        ┌────────▼───────┐ ┌───────▼────────┐
        │  API .NET      │ │  API NestJS    │
        │  (identidad +  │ │  (citas /      │
        │   inventario)  │ │   clientes)    │
        └────────┬───────┘ └───────┬────────┘
                 │                 │
                 └───────┬─────────┘
                    ┌────▼────┐
                    │ Neon    │  PostgreSQL
                    │ Postgres│  (aislamiento por tenant_id)
                    └─────────┘
```

- **Login único con JWT** emitido por la API .NET; la API NestJS valida el mismo
  token (secreto compartido), así un token sirve en ambos backends.
- **Módulos por empresa:** el menú del frontend se arma según los módulos
  activados para la empresa del usuario.
- **Multi-tenant:** cada registro lleva `tenant_id`; las consultas filtran por la
  empresa del token.

## 🧰 Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Angular 21, Bootstrap 5, NgRx, ApexCharts (plantilla Reback) |
| Backend A | .NET 10 (C#), Entity Framework Core, Npgsql |
| Backend B | NestJS (Node.js) · *en construcción* |
| Base de datos | PostgreSQL en Neon |
| Autenticación | JWT (secreto compartido entre backends) |

## 📁 Estructura del proyecto

```
.
├── web/          Frontend Angular (panel)
├── api-dotnet/   Backend .NET — identidad + Inventario
│   └── Gestion.Api/
├── api-nest/     Backend NestJS — Spa (en construcción)
├── neon.ts       Configuración de servicios de Neon
└── .env.example  Variables de entorno necesarias
```

## ✅ Requisitos previos

- [Node.js](https://nodejs.org) 20+ y npm
- [.NET SDK](https://dotnet.microsoft.com/download) 10
- [Neon CLI](https://neon.tech) (`npm i -g neon`) y una cuenta de Neon

## 🚀 Puesta en marcha

**1. Base de datos (Neon)** — provisiona los servicios y genera `.env.local`:

```bash
neon login
neon deploy
```

**2. Frontend:**

```bash
cd web
npm install
npm start          # http://localhost:4200
```

**3. Backend .NET:**

```bash
cd api-dotnet/Gestion.Api
dotnet run         # http://localhost:5045
```

Verifica la conexión a la base de datos:

```bash
curl http://localhost:5045/health/db
# { "status": "ok", "database": "neon-postgres", "version": "PostgreSQL 18.x ..." }
```

## 🔑 Variables de entorno

Los valores reales los genera `neon deploy` en `.env.local` (ignorado por Git).
Ver [`.env.example`](.env.example) para la lista completa:

| Variable | Uso |
|----------|-----|
| `DATABASE_URL` | Conexión *pooled* — tráfico normal de la app |
| `DATABASE_URL_UNPOOLED` | Conexión *directa* — migraciones y dumps |
| `NEON_BRANCH` | Branch activo de Neon |
| `NEON_AUTH_BASE_URL`, `NEON_AUTH_JWKS_URL` | Neon Auth |

## 🌿 Flujo de trabajo Git

| Rama | Propósito |
|------|-----------|
| `main` | Estable. **Solo recibe lo ya probado en `develop`.** |
| `develop` | Integración y trabajo del día a día. |
| `feature/*` | Una rama por funcionalidad; sale de `develop` y vuelve a `develop`. |
| `fix/*` | Correcciones puntuales. |

**Ciclo típico:**

```bash
git checkout develop
git checkout -b feature/modulo-inventario   # nueva funcionalidad
# ... trabajar y commitear ...
git checkout develop && git merge feature/modulo-inventario
# cuando develop está probado:
git checkout main && git merge develop && git push
```

## 🗺️ Roadmap

- [x] Estructura del monorepo + frontend base (Reback)
- [x] Backend .NET conectado a Neon Postgres (endpoint `/health/db`)
- [ ] Entidades y módulo de Inventario (.NET) + migraciones
- [ ] Login y JWT multi-tenant + módulos por empresa
- [ ] Backend NestJS (módulo Spa)
- [ ] Portafolio personal + despliegue en dominio propio

## 👤 Autor

**Ciro Alfonso Granados Zambrano** — Desarrollador de Software Full Stack
[GitHub @CiroY1](https://github.com/CiroY1)

## 📄 Licencia

Distribuido bajo la licencia MIT. Ver [`LICENSE`](LICENSE).
