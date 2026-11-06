import { evaluarPassword, PASSWORD_MIN } from './password-policy'

describe('evaluarPassword', () => {
  it('PASSWORD_MIN es 8', () => {
    expect(PASSWORD_MIN).toBe(8)
  })

  it('es válida con 8+ caracteres, letras y números', () => {
    expect(evaluarPassword('abc12345').valida).toBe(true)
    expect(evaluarPassword('Abcdef12').valida).toBe(true)
  })

  it('es inválida si falta número, falta letra o es muy corta', () => {
    expect(evaluarPassword('abcdefgh').valida).toBe(false) // sin número
    expect(evaluarPassword('12345678').valida).toBe(false) // sin letra
    expect(evaluarPassword('abc123').valida).toBe(false) // corta
    expect(evaluarPassword('').valida).toBe(false)
  })

  it('da un mensaje de qué falta', () => {
    expect(evaluarPassword('abc123').mensaje).toContain('8')
    expect(evaluarPassword('abcdefgh').mensaje).toContain('letras y números')
    expect(evaluarPassword('').mensaje).toBeNull()
  })

  it('el score crece con la complejidad', () => {
    expect(evaluarPassword('').score).toBe(0)
    expect(evaluarPassword('Abcdefg1!largo').score).toBeGreaterThanOrEqual(3)
  })
})
