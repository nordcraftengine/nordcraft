import {
  PROXY_TEMPLATES_IN_BODY,
  PROXY_URL_HEADER,
} from '@nordcraft/core/dist/utils/url'

/**
 * Omit the `cookie` header from a set of headers.
 * This is useful when proxying requests for routes/proxied API requests
 * to ensure cookies are not forwarded.
 */
export const skipCookieHeader = (headers: Headers) => {
  const newHeaders = new Headers(headers)
  newHeaders.delete('cookie')
  return newHeaders
}

export const REDIRECT_API_NAME_HEADER = 'x-nordcraft-redirect-api-name'
export const REDIRECT_COMPONENT_NAME_HEADER =
  'x-nordcraft-redirect-component-name'
export const REDIRECT_NAME_HEADER = 'x-nordcraft-redirect-name'

/**
 * Omit the "x-nordcraft-url" and "x-nordcraft-templates-in-body" headers
 * from a set of headers. Since these headers are only relevant for the
 * Nordcraft API proxy, it's not useful for other services to receive them
 */
export const skipNordcraftHeaders = (headers: Headers) => {
  const newHeaders = new Headers(headers)
  newHeaders.delete(PROXY_URL_HEADER)
  newHeaders.delete(PROXY_TEMPLATES_IN_BODY)
  return newHeaders
}

// https://datatracker.ietf.org/doc/html/rfc2616#section-13.5.1
const HOP_BY_HOP_HEADERS = [
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]

export const skipHopByHopHeaders = (headers: Headers) => {
  const newHeaders = new Headers(headers)
  for (const header of HOP_BY_HOP_HEADERS) {
    newHeaders.delete(header)
  }
  return newHeaders
}

export const skipContentEncodingHeader = (headers: Headers) => {
  const newHeaders = new Headers(headers)
  newHeaders.delete('content-encoding')
  return newHeaders
}
