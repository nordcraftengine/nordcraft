import { isDefined } from '@nordcraft/core'
import { parse } from 'cookie'

export const getRequestCookies = (req: Request) =>
  Object.fromEntries(
    Object.entries(parse(req.headers.get('cookie') ?? '')).filter(
      // Ensure that both key and value are defined
      (kv): kv is [string, string] => isDefined(kv[0]) && isDefined(kv[1]),
    ),
  )
