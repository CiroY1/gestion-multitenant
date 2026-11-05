# api-nest — Segundo backend (NestJS)

Segundo backend del sistema de gestión. El frontend Angular consume **dos**
backends a la vez:

| Backend   | Stack            | Puerto | Rol |
|-----------|------------------|--------|-----|
| `api-dotnet` | .NET 10 + EF Core | 5045 | Núcleo de identidad (login, emite el JWT) e inventario |
| `api-nest`   | NestJS 10        | 5046 | Segundo backend; valida el mismo JWT y comparte la base |

## Qué comparten

- **JWT (HS256)**: ambos usan el mismo `JWT_SECRET`. El token que entrega el
  login de `api-dotnet` se valida igual aquí (mismo `issuer` `gestion-api`,
  `audience` `gestion-clientes`). El login sigue siendo responsabilidad de .NET.
- **Base de datos Neon (Postgres)**: mismo `DATABASE_URL`.
- **Multi-tenant**: el `tenantId` se lee del claim del JWT en cada petición.

Los secretos viven en el `.env.local` de la raíz del repo (no se versiona);
este proyecto lo carga desde ahí, no duplica secretos.

## Endpoints (Paso 1 — diagnóstico)

- `GET /api/sistema/health` — público. Comprueba que el backend responde.
- `GET /api/sistema/me` — protegido. Devuelve la identidad del token (prueba JWT compartido).
- `GET /api/sistema/db-check` — protegido. Cuenta productos del tenant (prueba base + multi-tenant).

## Desarrollo

```bash
cd api-nest
npm install
npm run start:dev   # http://localhost:5046/api
```

El backend .NET debe haber corrido al menos una vez para que existan las tablas.
