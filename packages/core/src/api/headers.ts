import type { Nullable } from '../types'

/**
 * Checks if a header is a json (content-type) header
 * Also supports edge cases like application/vnd.api+json and application/vnd.contentful.delivery.v1+json
 * See https://jsonapi.org/#mime-types
 */
export const isJsonHeader = (header?: Nullable<string>) => {
  if (typeof header !== 'string') {
    return false
  }
  return /^application\/(json|.*\+json)/.test(header)
}

export const isTextHeader = (header?: Nullable<string>) => {
  if (typeof header !== 'string') {
    return false
  }
  return /^(text\/|application\/x-www-form-urlencoded|application\/(xml|.*\+xml))/.test(
    header,
  )
}

export const isEventStreamHeader = (header?: Nullable<string>) => {
  if (typeof header !== 'string') {
    return false
  }
  return /^text\/event-stream/.test(header)
}

export const isJsonStreamHeader = (header?: Nullable<string>) => {
  if (typeof header !== 'string') {
    return false
  }
  return /^(application\/stream\+json|application\/x-ndjson)/.test(header)
}

export const isImageHeader = (header?: Nullable<string>) => {
  if (typeof header !== 'string') {
    return false
  }
  return /^image\//.test(header)
}

/**
 * Returns an object with headers from a Headers object
 * Duplicate header values (set-cookie for instance) are encoded as a comma-separated string
 */
export const mapHeadersToObject = (headers: Headers) => {
  const headersObject: Record<string, string> = {}
  for (const [key, value] of headers.entries()) {
    if (headersObject[key]) {
      headersObject[key] += `, ${value}`
    } else {
      headersObject[key] = value
    }
  }
  return headersObject
}
