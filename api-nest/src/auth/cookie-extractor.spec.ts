import { cookieExtractor } from './jwt.strategy'

describe('cookieExtractor', () => {
  it('extrae el token de la cookie access_token', () => {
    const req = { headers: { cookie: 'otra=1; access_token=abc.def.ghi; mas=2' } }
    expect(cookieExtractor(req)).toBe('abc.def.ghi')
  })

  it('devuelve null si no hay cookie access_token', () => {
    expect(cookieExtractor({ headers: { cookie: 'otra=1' } })).toBeNull()
    expect(cookieExtractor({ headers: {} })).toBeNull()
    expect(cookieExtractor({})).toBeNull()
  })

  it('decodifica valores url-encoded', () => {
    const req = { headers: { cookie: 'access_token=a%20b' } }
    expect(cookieExtractor(req)).toBe('a b')
  })
})
