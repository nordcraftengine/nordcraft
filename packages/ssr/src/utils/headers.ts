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

/**
 * Omit the x-nordcraft-url header from a set of headers.
 * Since this header is only relevant for Nordcraft requests, it's not useful
 * for other services to receive this.
 */
export const skipNordcraftHeaders = (headers: Headers) => {
  const newHeaders = new Headers(headers)
  newHeaders.delete(PROXY_URL_HEADER)
  newHeaders.delete(PROXY_TEMPLATES_IN_BODY)
  return newHeaders
}
