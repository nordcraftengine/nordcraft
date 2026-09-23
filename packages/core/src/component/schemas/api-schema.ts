import * as v from 'valibot'
import {
  ApiMethod,
  type ApiParserMode,
  type ApiRequest,
  type ComponentAPI,
  type LegacyComponentAPI,
} from '../../api/apiTypes'
import type { Formula } from '../../formula/formula'
import { EventModelSchema } from './event-schema'
import { FormulaSchema } from './formula-schema'
import { MetadataSchema, record } from './valibot-schemas'

// API Models
const ApiMethodSchema = v.pipe(
  v.enum(ApiMethod),
  v.description('HTTP method for the API request.'),
)

const ApiParserModeSchema: v.GenericSchema<unknown, ApiParserMode> = v.pipe(
  v.picklist(['auto', 'text', 'json', 'event-stream', 'json-stream', 'blob']),
  v.description('Available modes for parsing API responses.'),
)

const RedirectStatusCodes = {
  '300': 300,
  '301': 301,
  '302': 302,
  '303': 303,
  '304': 304,
  '307': 307,
  '308': 308,
} as const
const RedirectStatusCodeSchema: v.GenericSchema<unknown, Formula> = v.pipe(
  v.union([FormulaSchema, v.enum(RedirectStatusCodes)]),
  v.description('HTTP status code to use for the redirect.'),
) as v.GenericSchema<unknown, Formula>

const ApiRequestSchema: v.GenericSchema<unknown, ApiRequest> = v.pipe(
  v.object({
    '@nordcraft/metadata': v.pipe(
      v.nullish(MetadataSchema),
      v.description('Metadata for the API request'),
    ),
    version: v.pipe(
      v.literal(2),
      v.description(
        'Version of the API request schema. This should always be 2.',
      ),
    ),
    name: v.pipe(v.string(), v.description('Name of the API request.')),
    type: v.pipe(
      v.picklist(['http', 'ws']),
      v.description('Type of the API request.'),
    ),
    method: v.pipe(
      v.nullish(ApiMethodSchema),
      v.description('HTTP method for the API request.'),
    ),
    url: v.pipe(
      v.nullish(FormulaSchema),
      v.description(
        'Base URL for the API request. Params and query strings are added when this API is called.',
      ),
    ),
    service: v.pipe(
      v.nullish(v.string()),
      v.description(
        'Name of the service to use for the API request. Only Services defined in the project can be used here.',
      ),
    ),
    servicePath: v.pipe(
      v.nullish(v.string()),
      v.description(
        'File path to the service definition. If service is defined, servicePath must also be defined.',
      ),
    ),
    inputs: v.pipe(
      record(
        v.pipe(v.string(), v.description('Name of the input')),
        v.pipe(
          v.object({
            formula: v.nullish(FormulaSchema),
          }),
          v.description('Formula evaluating to the input value.'),
        ),
      ),
      v.description(
        'Inputs to the API request. Inputs have a default value that can be overridden when the API is started from a workflow. Inputs can be used inside any Formula in the API request definition.',
      ),
    ),
    path: v.pipe(
      v.nullish(
        record(
          v.pipe(v.string(), v.description('Name of the path segment')),
          v.object({
            formula: v.pipe(
              FormulaSchema,
              v.description(
                'Formula evaluating to the value of the path segment',
              ),
            ),
            index: v.pipe(
              v.number(),
              v.description('Index defining the order of the path segments.'),
            ),
          }),
        ),
      ),
      v.description('Path segments to include in the API request.'),
    ),
    queryParams: v.pipe(
      v.nullish(
        record(
          v.pipe(v.string(), v.description('Name of the query parameter')),
          v.object({
            formula: v.pipe(
              FormulaSchema,
              v.description(
                'Formula evaluating to the value of the query parameter',
              ),
            ),
            enabled: v.pipe(
              v.nullish(FormulaSchema),
              v.description(
                'Formula evaluating to whether the query parameter is included or not. If included it should evaluate to true.',
              ),
            ),
          }),
        ),
      ),
      v.description('Query parameters to include in the API request.'),
    ),
    headers: v.pipe(
      v.nullish(
        record(
          v.pipe(v.string(), v.description('Name of the header')),
          v.object({
            formula: v.pipe(
              FormulaSchema,
              v.description('Formula evaluating to the header value'),
            ),
            enabled: v.pipe(
              v.nullish(FormulaSchema),
              v.description(
                'Formula evaluating to whether the header is included or not. If included it should evaluate to true.',
              ),
            ),
          }),
        ),
      ),
      v.description('Headers to include in the API request.'),
    ),
    body: v.pipe(
      v.nullish(FormulaSchema),
      v.description('Body of the API request.'),
    ),
    autoFetch: v.pipe(
      v.nullish(FormulaSchema),
      v.description(
        'Indicates if the API request should be automatically fetched when the component or page loads.',
      ),
    ),
    client: v.pipe(
      v.nullish(
        v.object({
          parserMode: v.pipe(
            ApiParserModeSchema,
            v.description('Defines how the API response should be parsed.'),
          ),
          credentials: v.pipe(
            v.nullish(v.picklist(['include', 'same-origin', 'omit'])),
            v.description(
              'Indicates whether credentials such as cookies or authorization headers should be sent with the request.',
            ),
          ),
          debounce: v.pipe(
            v.nullish(v.object({ formula: FormulaSchema })),
            v.description(
              'Debounce time in milliseconds for the API request. Useful for limiting the number of requests made when inputs change rapidly.',
            ),
          ),
          onCompleted: v.pipe(
            v.nullish(EventModelSchema),
            v.description(
              'Event triggered when the API request completes successfully.',
            ),
          ),
          onFailed: v.pipe(
            v.nullish(EventModelSchema),
            v.description(
              'Event triggered when the API request fails. This is also triggered when the isError formula evaluates to true.',
            ),
          ),
          onMessage: v.pipe(
            v.nullish(EventModelSchema),
            v.description(
              'Event triggered when a message is received from the API. Only applicable for WebSocket and streaming APIs.',
            ),
          ),
        }),
      ),
      v.description('Client-side settings for the API request.'),
    ),
    server: v.pipe(
      v.nullish(
        v.object({
          proxy: v.pipe(
            v.nullish(
              v.object({
                enabled: v.pipe(
                  v.object({ formula: FormulaSchema }),
                  v.description(
                    'Indicates if the API request should be proxied through the Nordcraft backend server. This is useful for avoiding CORS issues or hiding sensitive information in the request. It is also useful if the request needs access to http-only cookies.',
                  ),
                ),
                useTemplatesInBody: v.pipe(
                  v.nullish(v.object({ formula: FormulaSchema })),
                  v.description(
                    'Indicates if templates in the body should be processed when proxying the request. A template could be a http-only cookie that needs to be included in the proxied request. Enabling this flag will ensure that templates in the body are processed before sending the proxied request.',
                  ),
                ),
              }),
            ),
            v.description('Proxy settings for the API request.'),
          ),
          ssr: v.pipe(
            v.nullish(
              v.object({
                enabled: v.pipe(
                  v.nullish(v.object({ formula: FormulaSchema })),
                  v.description(
                    'Indicates if server-side rendering is enabled for this API request. This means the API will be executed on the server during the initial page load. Note: This can have performance implications for the loading of a page on slow APIs.',
                  ),
                ),
              }),
            ),
            v.description('Server-side rendering settings.'),
          ),
        }),
      ),
      v.description('Server-side settings for the API request.'),
    ),
    timeout: v.pipe(
      v.nullish(v.object({ formula: FormulaSchema })),
      v.description('Timeout for the API request in milliseconds.'),
    ),
    hash: v.nullish(v.object({ formula: FormulaSchema })),
    isError: v.pipe(
      v.nullish(v.object({ formula: FormulaSchema })),
      v.description(
        'Indicates if the last API response was an error. Useful for forcing a response to be treated as an error even if status code is 200.',
      ),
    ),
    redirectRules: v.pipe(
      v.nullish(
        record(
          v.pipe(v.string(), v.description('The key of the redirect rule.')),
          v.pipe(
            v.object({
              formula: v.pipe(
                FormulaSchema,
                v.description(
                  'Formula evaluating to the URL. If a URL is returned, the redirect will be triggered. If null is returned, no redirect will happen.',
                ),
              ),
              index: v.pipe(
                v.number(),
                v.description(
                  'Index defining the order of the redirect rules.',
                ),
              ),
              statusCode: v.pipe(
                v.nullish(RedirectStatusCodeSchema),
                v.description('HTTP status code to use for the redirect.'),
              ),
            }),
            v.description('Defines a single redirect rule.'),
          ),
        ),
      ),
      v.description(
        'Rules for redirecting based on response data. The key is a unique identifier for the rule.',
      ),
    ),
    dependsOn: v.pipe(
      v.optional(v.array(v.string())),
      v.description('List of APIs that this API depends on.'),
    ),
  }),
  v.description('Schema defining an API request from a component or a page.'),
)

const LegacyComponentAPISchema: v.GenericSchema<unknown, LegacyComponentAPI> =
  v.pipe(
    v.object({
      type: v.literal('REST'),
      name: v.string(),
      method: v.picklist(['GET', 'POST', 'DELETE', 'PUT']),
      url: v.nullish(FormulaSchema),
      path: v.nullish(v.array(v.object({ formula: FormulaSchema }))),
      queryParams: v.nullish(
        record(
          v.string(),
          v.object({
            name: v.string(),
            formula: FormulaSchema,
          }),
        ),
      ),
      headers: v.nullish(
        v.union([record(v.string(), FormulaSchema), FormulaSchema]),
      ),
      body: v.nullish(FormulaSchema),
      autoFetch: v.nullish(FormulaSchema),
      proxy: v.nullish(v.boolean()),
      debounce: v.nullish(v.number()),
      throttle: v.nullish(v.number()),
      onCompleted: v.nullish(EventModelSchema),
      onFailed: v.nullish(EventModelSchema),
      auth: v.nullish(
        v.object({
          type: v.picklist(['Bearer id_token', 'Bearer access_token']),
        }),
      ),
      dependsOn: v.optional(v.array(v.string())),
    }),
    v.description(
      'Legacy API schema for backward compatibility. Never use this for new APIs.',
    ),
  )

export const ComponentAPISchema: v.GenericSchema<unknown, ComponentAPI> =
  v.union([LegacyComponentAPISchema, ApiRequestSchema])
