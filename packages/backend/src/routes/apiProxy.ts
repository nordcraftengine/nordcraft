import {
  HttpMethodsWithAllowedBody,
  NON_BODY_RESPONSE_CODES,
} from '@nordcraft/core/dist/api/api'
import type { ApiMethod } from '@nordcraft/core/dist/api/apiTypes'
import {
  PROXY_TEMPLATES_IN_BODY,
  PROXY_URL_HEADER,
  validateUrl,
} from '@nordcraft/core/dist/utils/url'
import { getRequestCookies } from '@nordcraft/ssr/dist/rendering/cookies'
import {
  applyTemplateValues,
  sanitizeProxyHeaders,
} from '@nordcraft/ssr/dist/rendering/template'
import type { Context } from 'hono'
import { endTime, startTime } from 'hono/timing'
import type { StatusCode } from 'hono/utils/http-status'
import type { HonoEnv } from '../../hono'

export const proxyRequestHandler = async (
  c: Context<HonoEnv, '/.toddle/omvej/components/:componentName/apis/:apiName'>,
): Promise<Response> => {
  const req = c.req.raw
  const requestCookies = getRequestCookies(req)
  const requestUrl = new URL(req.url)
  const outgoingRequestUrl = validateUrl(
    // Replace potential cookie values in the URL
    {
      path: applyTemplateValues(
        req.headers.get(PROXY_URL_HEADER),
        requestCookies,
      ),
      origin: requestUrl.origin,
    },
  )
  if (!outgoingRequestUrl) {
    return c.json(
      {
        error: `The provided URL is invalid: ${req.headers.get(
          PROXY_URL_HEADER,
        )}`,
      },
      { status: 400 },
    )
  }
  let headers: Headers
  try {
    headers = sanitizeProxyHeaders({
      cookies: requestCookies,
      headers: req.headers,
    })
  } catch {
    return c.json(
      {
        error:
          'Proxy validation failed: one or more headers had an invalid name/value',
      },
      { status: 400 },
    )
  }
  try {
    let templateBody: string | undefined
    if (
      HttpMethodsWithAllowedBody.includes(req.method as ApiMethod) &&
      req.headers.get(PROXY_TEMPLATES_IN_BODY) !== null
    ) {
      // If the request has the PROXY_TEMPLATES_IN_BODY header set,
      // we must apply the template values to the body as well
      try {
        const bodyText = await req.text()
        const contentType = req.headers.get('content-type')?.toLowerCase()

        if (contentType?.includes('application/x-www-form-urlencoded')) {
          // Parse form data, apply templates to values, then re-encode
          templateBody = new URLSearchParams(
            Object.fromEntries(
              new URLSearchParams(bodyText)
                .entries()
                .map(([key, value]) => [
                  key,
                  applyTemplateValues(value, requestCookies),
                ]),
            ),
          ).toString()
        } else {
          // Handle other content types (JSON, text, etc.)
          templateBody = applyTemplateValues(bodyText, requestCookies)
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Error applying template values to request body', e)
        return c.json(
          {
            error:
              'Error applying template values to request body. Perhaps the request body was not text?',
          },
          { status: 400 },
        )
      }
    }
    const request = new Request(outgoingRequestUrl.href, {
      // We copy over the method
      method: c.req.method,
      headers,
      // We use the adjusted body or forward the body as is
      body: templateBody ?? req.body,
      // Let's add a 5s timeout
      signal: AbortSignal.timeout(5000),
    })
    let response: Response
    try {
      // Remove the cf-connecting-ip header if the request is from localhost
      // This is to prevent cf to throw an error when the requester ip is ::1
      if ((request.headers.get('host') ?? '').startsWith('localhost')) {
        request.headers.delete('cf-connecting-ip')
      }
      const timingKey = 'apiProxyFetch'
      startTime(c, timingKey)
      response = await fetch(request)
      endTime(c, timingKey)
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error('API request error', e.message)
      const status = e instanceof Error && e.name === 'TimeoutError' ? 504 : 500
      response = c.json(e.message, { status })
    }

    // Pass the stream into a new response so we can write the headers
    const body = NON_BODY_RESPONSE_CODES.includes(response.status)
      ? undefined
      : ((response.body ?? new ReadableStream()) as ReadableStream)

    response.headers.entries().forEach(([name, value]) => {
      c.header(name, value, { append: true })
    })
    c.status(response.status as StatusCode)
    if (body) {
      return c.body(body)
    }
    return c.res
  } catch (e) {
    const error =
      e instanceof Error
        ? e.message
        : 'Unable to build a valid request from the API definition'
    return c.json({ error }, { status: 500 })
  }
}
