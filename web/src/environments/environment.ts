export const environment = {
  production: false,
  // URL base de la API .NET (backend de Inventario e identidad)
  apiUrl: 'http://localhost:5045/api',
  // URL base del segundo backend (NestJS). Valida el mismo JWT y comparte la base.
  nestApiUrl: 'http://localhost:5046/api',
  // Cloudinary: subida de imágenes (logos) sin firma. Ninguno es secreto.
  // cloudName: tu "cloud name" de Cloudinary.
  // uploadPreset: un "upload preset" en modo Unsigned (Settings > Upload).
  // Mientras estén vacíos, el modal solo permite pegar la URL del logo.
  cloudinary: {
    cloudName: 'lgv2gx8m',
    uploadPreset: 'ml_default',
  },
}
