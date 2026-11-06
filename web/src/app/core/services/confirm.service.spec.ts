import { ConfirmService } from './confirm.service'

describe('ConfirmService', () => {
  let svc: ConfirmService

  beforeEach(() => {
    svc = new ConfirmService()
  })

  it('ask() muestra el modal y responder(true) lo resuelve en true', async () => {
    const p = svc.ask({ mensaje: '¿Seguro?' })
    expect(svc.visible()).toBe(true)
    svc.responder(true)
    expect(svc.visible()).toBe(false)
    expect(await p).toBe(true)
  })

  it('responder(false) resuelve en false', async () => {
    const p = svc.ask({ mensaje: '¿Seguro?' })
    svc.responder(false)
    expect(await p).toBe(false)
  })

  it('aplica valores por defecto (título, textos, peligro)', () => {
    svc.ask({ mensaje: 'x' })
    const o = svc.opts()!
    expect(o.titulo).toBe('Confirmar')
    expect(o.confirmar).toBe('Confirmar')
    expect(o.cancelar).toBe('Cancelar')
    expect(o.peligro).toBe(true)
  })
})
