import {
  createApiRequest,
  HttpMethodsWithAllowedBody,
} from '@nordcraft/core/dist/api/api'
import { ApiMethod, type ApiRequest } from '@nordcraft/core/dist/api/apiTypes'
import type { FormulaContext } from '@nordcraft/core/dist/formula/formula'
import { PROXY_URL_HEADER } from '@nordcraft/core/dist/utils/url'

const INTROSPECTION_QUERY = `\
query IntrospectionQuery {
  __schema {
    queryType { ...FullType }
    mutationType { ...FullType }
    subscriptionType { ...FullType }
    types {
      ...FullType
    }
    directives {
      name
      description
      locations
      args {
        ...InputValue
      }
    }
  }
}
fragment FullType on __Type {
  kind
  name
  description
  fields(includeDeprecated: true) {
    name
    description
    args {
      ...InputValue
    }
    type {
      ...TypeRef
    }
    isDeprecated
    deprecationReason
  }
  inputFields {
    ...InputValue
  }
  interfaces {
    ...TypeRef
  }
  enumValues(includeDeprecated: true) {
    name
    description
    isDeprecated
    deprecationReason
  }
  possibleTypes {
    ...TypeRef
  }
}
fragment InputValue on __InputValue {
  name
  description
  type { ...TypeRef }
  defaultValue
}
fragment TypeRef on __Type {
  kind
  name
  ofType {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
              }
            }
          }
        }
      }
    }
  }
}`

/**
 * Run an introspection query for an existing API
 * The introspection will usually be a POST request, but we use the method
 * from the original API to support other methods.
 */
export const introspectApiRequest = async ({
  api,
  componentName,
  formulaContext,
}: {
  api: ApiRequest
  componentName: string
  formulaContext: FormulaContext
}) => {
  const { url, requestSettings } = createApiRequest({
    api: {
      ...(api as ApiRequest),
      // Default to a POST request if the method of the original API doesn't support a body
      // The introspection query should never be initiated in that case though
      method: HttpMethodsWithAllowedBody.includes(api.method ?? ApiMethod.POST)
        ? api.method
        : ApiMethod.POST,
      // Overwrite the body with a default introspection query (in a value formula)
      body: {
        type: 'value',
        value: { query: INTROSPECTION_QUERY },
      },
    },
    baseUrl: window.origin,
    defaultHeaders: undefined,
    formulaContext,
  })
  // We must proxy to be able to include cookies
  const proxyUrl = `/.toddle/omvej/components/${encodeURIComponent(
    componentName,
  )}/apis/${encodeURIComponent(componentName)}:${encodeURIComponent(api.name)}`
  const headers = new Headers(requestSettings.headers)
  headers.set(
    PROXY_URL_HEADER,
    decodeURIComponent(url.href.replace(/\+/g, ' ')),
  )
  requestSettings.headers = headers
  const response = await fetch(proxyUrl, {
    ...requestSettings,
    // Set credentials to what was set on the original API
    credentials:
      api.client?.credentials &&
      ['include', 'same-origin', 'omit'].includes(api.client.credentials)
        ? api.client.credentials
        : // Default to same-origin
          undefined,
  })
  try {
    const data = await response.json()
    if (response.ok) {
      return data
    } else {
      // eslint-disable-next-line no-console
      console.error('Failed to introspect API:', api.name, data)
      // Return a generic error message if introspection failed
      return { error: data?.message ?? 'Failed to parse introspection result' }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to parses API response:', api.name, e)
    // Return a generic error message if introspection failed
    return { error: `Failed to introspect API: ${api.name}` }
  }
}
