export const environment = {
  production: false,
  // URL base de la API .NET (backend de Inventario e identidad)
  apiUrl: 'http://localhost:5045/api',
  // URL base del segundo backend (NestJS). Valida el mismo JWT y comparte la base.
  nestApiUrl: 'http://localhost:5046/api',
}
