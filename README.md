# Plataforma de Gestión Multi-Tenant

SaaS multi-tenant con módulos activables por empresa. Un panel en Angular que
consume dos backends independientes, con autenticación JWT compartida y
aislamiento de datos por empresa (`tenant_id`).

## Arquitectura

```
web/         → Frontend Angular 21 (base: plantilla Reback) — consume ambas APIs
api-dotnet/  → API .NET — núcleo de identidad + módulo Inventario
api-nest/    → API NestJS — módulo Spa (citas / clientes)
```

- **Login único con JWT** emitido por la API .NET; la API Nest valida el mismo
  token (secreto compartido).
- **Módulos por empresa:** el menú del frontend se arma según los módulos
  activados para la empresa del usuario.
- **Multi-tenant:** cada registro lleva `tenant_id`; las consultas filtran por la
  empresa del token.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Angular 21, Bootstrap 5, NgRx, ApexCharts |
| Backend A | .NET (C#), Entity Framework Core |
| Backend B | NestJS (Node.js), TypeORM |
| Base de datos | PostgreSQL (Neon) |

## Puesta en marcha

```bash
# Frontend
cd web
npm install
npm start        # http://localhost:4200
```

Las instrucciones de cada backend se agregan en `api-dotnet/` y `api-nest/`.
