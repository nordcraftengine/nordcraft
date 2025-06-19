import { STRING_TEMPLATE } from '@nordcraft/core/dist/api/template'
import type { NordcraftServerEnv } from '@nordcraft/core/dist/formula/formula'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import { skipCookieHeader, skipNordcraftHeaders } from '../utils/headers'

export const applyTemplateValues = (
  input: string | null | undefined,
  cookies: Partial<NordcraftServerEnv['request']['cookies']>,
) => {
  if (!isDefined(input)) {
    return ''
  }
  const cookieRegex = /{{ cookies\.(.+?) }}/gm
  let output = input
  const cookieNames = new Set<string>()
  let m: RegExpExecArray | null
  while ((m = cookieRegex.exec(input)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === cookieRegex.lastIndex) {
      cookieRegex.lastIndex++
    }
    cookieNames.add(m[1])
  }
  for (const cookieName of cookieNames) {
    const cookieValue = cookies[cookieName]
    output = output.replaceAll(
      STRING_TEMPLATE('cookies', cookieName),
      // We fallback to an empty string to avoid sending the internal
      // template format ('{{ cookies.<cookie> }}') to other services/APIs
      cookieValue ?? '',
    )
  }
  return output
}

export const sanitizeProxyHeaders = ({
  cookies,
  headers,
}: {
  cookies: Record<string, string>
  headers: Headers
}) =>
  new Headers(
    mapTemplateHeaders({
      cookies,
      headers: skipCookieHeader(skipNordcraftHeaders(headers)),
    }),
  )

export const mapTemplateHeaders = ({
  cookies,
  headers,
}: {
  cookies: Record<string, string>
  headers: Headers
}) =>
  new Headers(
    [...headers.entries()].map(([name, value]): [string, string] => [
      name,
      // Replace template values in the header value
      applyTemplateValues(value, cookies),
    ]),
  )
