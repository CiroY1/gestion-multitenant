import { schemaDeTenant } from './db.service'

describe('schemaDeTenant', () => {
  it('devuelve t_<id> para un tenant válido', () => {
    expect(schemaDeTenant('demo')).toBe('t_demo')
    expect(schemaDeTenant('bebefeliz')).toBe('t_bebefeliz')
    expect(schemaDeTenant('empresa_1')).toBe('t_empresa_1')
  })

  it('rechaza tenants con caracteres peligrosos (anti-inyección)', () => {
    expect(() => schemaDeTenant('demo; DROP TABLE')).toThrow()
    expect(() => schemaDeTenant('Demo')).toThrow() // mayúsculas no permitidas
    expect(() => schemaDeTenant('')).toThrow()
    expect(() => schemaDeTenant('a-b')).toThrow()
  })
})
