/**
 * Política de contraseñas compartida por el frontend. El backend aplica la
 * MISMA regla (nunca se confía solo en el cliente): mínimo de longitud y que
 * incluya letras y números.
 */
export const PASSWORD_MIN = 8

export interface FuerzaPassword {
  /** Cumple el mínimo para poder guardarse. */
  valida: boolean
  /** Puntaje 0..4 para el medidor visual. */
  score: number
  etiqueta: string
  /** Qué falta (si algo), para mostrar al usuario. */
  mensaje: string | null
}

export function evaluarPassword(pwd: string): FuerzaPassword {
  const p = pwd ?? ''
  const tieneLetra = /[a-zA-Z]/.test(p)
  const tieneNumero = /[0-9]/.test(p)
  const tieneMayus = /[A-Z]/.test(p)
  const tieneSimbolo = /[^a-zA-Z0-9]/.test(p)
  const largaOk = p.length >= PASSWORD_MIN

  // Requisito mínimo para guardar: longitud + letra + número.
  const valida = largaOk && tieneLetra && tieneNumero

  // Puntaje para el medidor (0..4).
  let score = 0
  if (largaOk) score++
  if (p.length >= 12) score++
  if (tieneLetra && tieneNumero) score++
  if (tieneMayus && tieneSimbolo) score++
  score = Math.min(score, 4)

  const etiquetas = ['Muy débil', 'Débil', 'Aceptable', 'Fuerte', 'Muy fuerte']
  let mensaje: string | null = null
  if (!p) mensaje = null
  else if (!largaOk) mensaje = `Mínimo ${PASSWORD_MIN} caracteres.`
  else if (!tieneLetra || !tieneNumero) mensaje = 'Debe incluir letras y números.'

  return { valida, score, etiqueta: etiquetas[score], mensaje }
}
