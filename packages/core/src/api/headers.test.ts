import { mapHeadersToObject } from './headers'

describe('mapHeadersToObject()', () => {
  test('it maps Headers to a plain object', () => {
    const headers = mapHeadersToObject(
      new Headers([
        ['accept', 'application/json'],
        ['origin', 'my.origin.com'],
        ['set-cookie', 'sessionId=12345'],
        ['set-cookie', 'userId=67890'],
      ]),
    )
    expect(headers['accept']).toEqual('application/json')
    expect(headers['origin']).toEqual('my.origin.com')
    expect(headers['set-cookie']).toBe('sessionId=12345, userId=67890')
  })
})
