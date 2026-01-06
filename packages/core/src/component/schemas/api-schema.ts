import { z } from 'zod'
import type {
  ApiParserMode,
  ApiRequest,
  ComponentAPI,
  LegacyComponentAPI,
} from '../../api/apiTypes'
import { EventModelSchema } from './event-schema'
import { FormulaSchema } from './formula-schema'
import { MetadataSchema } from './zod-schemas'

// API Models
const ApiMethodSchema: z.ZodType<any> = z
  .enum(['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'HEAD', 'OPTIONS'])
  .describe('HTTP method for the API request.')

const ApiParserModeSchema: z.ZodType<ApiParserMode> = z
  .enum(['auto', 'text', 'json', 'event-stream', 'json-stream', 'blob'])
  .describe('Available modes for parsing API responses.')

const RedirectStatusCodes = {
  '300': 300,
  '301': 301,
  '302': 302,
  '303': 303,
  '304': 304,
  '307': 307,
  '308': 308,
}
const RedirectStatusCodeSchema: z.ZodType<any> = z
  .enum(RedirectStatusCodes)
  .describe('HTTP status code to use for the redirect.')

const ApiRequestSchema: z.ZodType<ApiRequest> = z
  .object({
    '@nordcraft/metadata': MetadataSchema.optional()
      .nullable()
      .describe('Metadata for the API request'),
    version: z
      .literal(2)
      .describe('Version of the API request schema. This should always be 2.'),
    name: z.string().describe('Name of the API request.'),
    type: z.enum(['http', 'ws']).describe('Type of the API request.'),
    method: ApiMethodSchema.optional()
      .nullable()
      .describe('HTTP method for the API request.'),
    url: FormulaSchema.optional()
      .nullable()
      .describe(
        'Base URL for the API request. Params and query strings are added when this API is called.',
      ),
    service: z
      .string()
      .nullable()
      .optional()
      .nullable()
      .describe(
        'Name of the service to use for the API request. Only Services defined in the project can be used here.',
      ),
    servicePath: z
      .string()
      .nullable()
      .optional()
      .nullable()
      .describe(
        'File path to the service definition. If service is defined, servicePath must also be defined.',
      ),
    inputs: z
      .record(
        z.string().describe('Name of the input'),
        z
          .object({
            formula: FormulaSchema.nullable(),
          })
          .describe('Formula evaluating to the input value.'),
      )
      .describe(
        'Inputs to the API request. Inputs have a default value that can be overridden when the API is started from a workflow. Inputs can be used inside any Formula in the API request definition.',
      ),
    path: z
      .record(
        z.string().describe('Name of the path segment'),
        z.object({
          formula: FormulaSchema.describe(
            'Formula evaluating to the value of the path segment',
          ),
          index: z
            .number()
            .describe('Index defining the order of the path segments.'),
        }),
      )
      .optional()
      .nullable()
      .describe('Path segments to include in the API request.'),
    queryParams: z
      .record(
        z.string().describe('Name of the query parameter'),
        z.object({
          formula: FormulaSchema.describe(
            'Formula evaluating to the value of the query parameter',
          ),
          enabled: FormulaSchema.nullable()
            .optional()
            .nullable()
            .describe(
              'Formula evaluating to whether the query parameter is included or not. If included it should evaluate to true.',
            ),
        }),
      )
      .optional()
      .nullable()
      .describe('Query parameters to include in the API request.'),
    headers: z
      .record(
        z.string().describe('Name of the header'),
        z.object({
          formula: FormulaSchema.describe(
            'Formula evaluating to the header value',
          ),
          enabled: FormulaSchema.nullable()
            .optional()
            .nullable()
            .describe(
              'Formula evaluating to whether the header is included or not. If included it should evaluate to true.',
            ),
        }),
      )
      .optional()
      .nullable()
      .describe('Headers to include in the API request.'),
    body: FormulaSchema.optional()
      .nullable()
      .describe('Body of the API request.'),
    autoFetch: FormulaSchema.nullable()
      .optional()
      .nullable()
      .describe(
        'Indicates if the API request should be automatically fetched when the component or page loads.',
      ),
    client: z
      .object({
        parserMode: ApiParserModeSchema.describe(
          'Defines how the API response should be parsed.',
        ),
        credentials: z
          .enum(['include', 'same-origin', 'omit'])
          .optional()
          .nullable()
          .describe(
            'Indicates whether credentials such as cookies or authorization headers should be sent with the request.',
          ),
        debounce: z
          .object({ formula: FormulaSchema })
          .nullable()
          .optional()
          .nullable()
          .describe(
            'Debounce time in milliseconds for the API request. Useful for limiting the number of requests made when inputs change rapidly.',
          ),
        onCompleted: EventModelSchema.nullable()
          .optional()
          .nullable()
          .describe(
            'Event triggered when the API request completes successfully.',
          ),
        onFailed: EventModelSchema.nullable()
          .optional()
          .nullable()
          .describe(
            'Event triggered when the API request fails. This is also triggered when the isError formula evaluates to true.',
          ),
        onMessage: EventModelSchema.nullable()
          .optional()
          .nullable()
          .describe(
            'Event triggered when a message is received from the API. Only applicable for WebSocket and streaming APIs.',
          ),
      })
      .optional()
      .nullable()
      .describe('Client-side settings for the API request.'),
    server: z
      .object({
        proxy: z
          .object({
            enabled: z
              .object({ formula: FormulaSchema })
              .describe(
                'Indicates if the API request should be proxied through the Nordcraft backend server. This is useful for avoiding CORS issues or hiding sensitive information in the request. It is also useful if the request needs access to http-only cookies.',
              ),
            useTemplatesInBody: z
              .object({ formula: FormulaSchema })
              .nullable()
              .optional()
              .nullable()
              .describe(
                'Indicates if templates in the body should be processed when proxying the request. A template could be a http-only cookie that needs to be included in the proxied request. Enabling this flag will ensure that templates in the body are processed before sending the proxied request.',
              ),
          })
          .nullable()
          .optional()
          .nullable()
          .describe('Proxy settings for the API request.'),
        ssr: z
          .object({
            enabled: z
              .object({ formula: FormulaSchema })
              .nullable()
              .optional()
              .nullable()
              .describe(
                'Indicates if server-side rendering is enabled for this API request. This means the API will be executed on the server during the initial page load. Note: This can have performance implications for the loading of a page on slow APIs.',
              ),
          })
          .optional()
          .nullable()
          .describe('Server-side rendering settings.'),
      })
      .optional()
      .nullable()
      .describe('Server-side settings for the API request.'),
    timeout: z
      .object({ formula: FormulaSchema })
      .nullable()
      .optional()
      .nullable()
      .describe('Timeout for the API request in milliseconds.'),
    hash: z.object({ formula: FormulaSchema }).nullable().optional().nullable(),
    isError: z
      .object({ formula: FormulaSchema })
      .nullable()
      .optional()
      .nullable()
      .describe(
        'Indicates if the last API response was an error. Useful for forcing a response to be treated as an error even if status code is 200.',
      ),
    redirectRules: z
      .record(
        z.string().describe('The key of the redirect rule.'),
        z
          .object({
            formula: FormulaSchema.describe(
              'Formula evaluating to the URL. If a URL is returned, the redirect will be triggered. If null is returned, no redirect will happen.',
            ),
            index: z
              .number()
              .describe('Index defining the order of the redirect rules.'),
            statusCode: RedirectStatusCodeSchema.nullable()
              .optional()
              .nullable()
              .describe('HTTP status code to use for the redirect.'),
          })
          .describe('Defines a single redirect rule.'),
      )
      .nullable()
      .optional()
      .nullable()
      .describe(
        'Rules for redirecting based on response data. The key is a unique identifier for the rule.',
      ),
  })
  .describe('Schema defining an API request from a component or a page.')

const LegacyComponentAPISchema: z.ZodType<LegacyComponentAPI> = z
  .object({
    type: z.literal('REST'),
    name: z.string(),
    method: z.enum(['GET', 'POST', 'DELETE', 'PUT']),
    url: FormulaSchema.optional().nullable(),
    path: z
      .array(z.object({ formula: FormulaSchema }))
      .optional()
      .nullable(),
    queryParams: z
      .record(
        z.string(),
        z.object({
          name: z.string(),
          formula: FormulaSchema,
        }),
      )
      .optional()
      .nullable(),
    headers: z
      .union([z.record(z.string(), FormulaSchema), FormulaSchema])
      .optional()
      .nullable(),
    body: FormulaSchema.optional().nullable(),
    autoFetch: FormulaSchema.nullable().optional().nullable(),
    proxy: z.boolean().optional().nullable(),
    debounce: z.number().nullable().optional().nullable(),
    throttle: z.number().nullable().optional().nullable(),
    onCompleted: EventModelSchema.nullable(),
    onFailed: EventModelSchema.nullable(),
    auth: z
      .object({
        type: z.enum(['Bearer id_token', 'Bearer access_token']),
      })
      .optional()
      .nullable(),
  })
  .describe(
    'Legacy API schema for backward compatibility. Never use this for new APIs.',
  )

export const ComponentAPISchema: z.ZodType<ComponentAPI> = z.union([
  LegacyComponentAPISchema,
  ApiRequestSchema,
])
