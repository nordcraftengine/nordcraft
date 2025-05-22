import { describe, expect, test } from 'bun:test'
import { applyTemplateValues } from './template'

describe('template', () => {
  test('it replaces all injected cookie values', () => {
    expect(
      applyTemplateValues(
        'this is a test {{ cookies.access_token }} and another value {{ cookies.refresh_token }} + finally {{ cookies.access_token }}',
        {
          access_token: 'my-access-token',
          refresh_token: 'my-refresh-token',
        },
      ),
    ).toEqual(
      'this is a test my-access-token and another value my-refresh-token + finally my-access-token',
    )
  })
  test('it replaces unknown cookies with an empty string', () => {
    expect(
      applyTemplateValues(
        'this is a test {{ cookies.unknown_cookie }} and {{ cookies.known_cookie }}',
        {
          known_cookie: 'my-known-cookie',
        },
      ),
    ).toEqual('this is a test  and my-known-cookie')
  })
})
