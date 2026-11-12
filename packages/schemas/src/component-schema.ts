import type {
  Component,
  ComponentMeta,
  PageComponent,
  TestScenario,
} from '@nordcraft/core'
import * as v from 'valibot'
import { ActionModelSchema } from './action-schema'
import { ComponentAPISchema } from './api-schema'
import { ComponentAttributeSchema } from './attribute-schema'
import { ComponentContextSchema } from './context-schema'
import { ComponentEventSchema } from './event-schema'
import { ComponentFormulaSchema } from './formula-schema'
import { NodeModelSchema } from './node-schema'
import { RouteSchema } from './route-schema'
import { MetadataSchema, record, SCHEMA_DESCRIPTIONS } from './valibot-schemas'
import { ComponentVariableSchema } from './variable-schema'
import { ComponentWorkflowSchema } from './workflow-schema'

export const TestScenarioApiStatusSchema = v.pipe(
  v.object({
    data: v.pipe(v.unknown(), v.description('Mock response data for the API.')),
    isLoading: v.pipe(
      v.boolean(),
      v.description('Mock loading state of the API.'),
    ),
    error: v.pipe(
      v.unknown(),
      v.description('Mock error state or payload for the API.'),
    ),
    response: v.pipe(
      v.nullish(
        v.object({
          status: v.pipe(
            v.nullish(v.number()),
            v.description('Mock HTTP status code (e.g. 200, 404).'),
          ),
          headers: v.pipe(
            v.nullish(record(v.string(), v.string())),
            v.description('Mock HTTP response headers.'),
          ),
          performance: v.pipe(
            v.nullish(
              v.object({
                requestStart: v.nullish(v.number()),
                responseStart: v.nullish(v.number()),
                responseEnd: v.nullish(v.number()),
              }),
            ),
            v.description('Mock performance metrics for the API request.'),
          ),
          debug: v.pipe(
            v.nullish(v.unknown()),
            v.description('Optional debug information for the API.'),
          ),
        }),
      ),
      v.description(
        'Mock HTTP response metadata including status and headers.',
      ),
    ),
    inputs: v.pipe(
      v.nullish(record(v.string(), v.unknown())),
      v.description('Mock inputs passed into the API request.'),
    ),
  }),
  v.description('Mock state for an API in the component.'),
)

export const TestScenarioSchema: v.GenericSchema<unknown, TestScenario> =
  v.pipe(
    v.object({
      '@nordcraft/metadata': v.pipe(
        v.nullish(MetadataSchema),
        v.description('Metadata associated with this test scenario.'),
      ),
      isDefault: v.pipe(
        v.nullish(v.boolean()),
        v.description(
          'Whether this is the default test scenario for previewing the component or page.',
        ),
      ),
      attributes: v.pipe(
        v.nullish(record(v.string(), v.unknown())),
        v.description('Mock attribute values to use during preview/testing.'),
      ),
      variables: v.pipe(
        v.nullish(record(v.string(), v.unknown())),
        v.description(
          'Mock variable values to override the variable initial values during preview/testing.',
        ),
      ),
      apis: v.pipe(
        v.nullish(record(v.string(), v.nullish(TestScenarioApiStatusSchema))),
        v.description(
          'Mock states for APIs in the component during this scenario.',
        ),
      ),
      path: v.pipe(
        v.nullish(record(v.string(), v.nullish(v.string()))),
        v.description(
          'Mock dynamic path parameter values for page routes (e.g. { id: "123" }).',
        ),
      ),
      query: v.pipe(
        v.nullish(record(v.string(), v.nullish(v.string()))),
        v.description(
          'Mock URL query parameter values for page routes (e.g. { tab: "overview" }).',
        ),
      ),
      contexts: v.pipe(
        v.nullish(record(v.string(), v.nullish(v.string()))),
        v.description(
          'Mapping of subscribed context providers to the specific test scenario to use from each provider.',
        ),
      ),
    }),
    v.description(
      'A test scenario defining mock inputs, state, and environment overrides for previewing and testing a component or page.',
    ),
  )

export const ComponentMetaSchema: v.GenericSchema<unknown, ComponentMeta> =
  v.pipe(
    v.object({
      description: v.pipe(
        v.nullish(v.string()),
        v.description(
          'A description explaining the purpose and usage of the component or page.',
        ),
      ),
      testScenarios: v.pipe(
        v.nullish(record(v.string(), v.nullish(TestScenarioSchema))),
        v.description(
          'Test scenarios for previewing the component or page with different state overrides during development.',
        ),
      ),
    }),
    v.description(
      'Metadata for the component or page, including description and test scenarios.',
    ),
  )

const commonComponentEntries = (type: 'component' | 'page') => ({
  name: v.pipe(v.string(), v.description(`Name of the ${type}`)),
  exported: v.pipe(
    v.nullish(v.boolean()),
    v.description(
      `Whether the ${type} is exported in a package project for use in other projects. Do not change this value. It should be managed by the user.`,
    ),
  ),
  nodes: v.pipe(
    v.nullish(record(v.string(), NodeModelSchema)),
    v.description(
      `All nodes in the ${type}, indexed by their unique IDs. Nodes represent HTML elements, text, slots, or ${type === 'component' ? 'other components' : 'components'}. They defined the UI structure of the ${type}.`,
    ),
  ),
  variables: v.pipe(
    v.nullish(record(v.string(), ComponentVariableSchema)),
    v.description(SCHEMA_DESCRIPTIONS.variables(type)),
  ),
  formulas: v.pipe(
    v.nullish(record(v.string(), ComponentFormulaSchema)),
    v.description(SCHEMA_DESCRIPTIONS.formulas(type)),
  ),
  workflows: v.pipe(
    v.nullish(record(v.string(), ComponentWorkflowSchema)),
    v.description(SCHEMA_DESCRIPTIONS.workflows(type)),
  ),
  apis: v.pipe(
    v.nullish(record(v.string(), ComponentAPISchema)),
    v.description(SCHEMA_DESCRIPTIONS.apis(type)),
  ),
  events: v.pipe(
    v.nullish(v.array(ComponentEventSchema)),
    v.description(
      'All events this the component can emit. Events allow the component to communicate with its parent or other components. They can be triggered via actions.',
    ),
  ),
  contexts: v.pipe(
    v.nullish(record(v.string(), ComponentContextSchema)),
    v.description(
      'Defines which contexts this component is subscribed to. Contexts allow the component to access formulas and workflows from other components, enabling reusability and modular design.',
    ),
  ),
  onLoad: v.pipe(
    v.nullish(
      v.object({
        trigger: v.literal('Load'),
        actions: v.array(ActionModelSchema),
      }),
    ),
    v.description(SCHEMA_DESCRIPTIONS.onLoad(type)),
  ),
  onAttributeChange: v.pipe(
    v.nullish(
      v.object({
        trigger: v.literal('Attribute change'),
        actions: v.array(ActionModelSchema),
      }),
    ),
    v.description(SCHEMA_DESCRIPTIONS.onAttributeChange(type)),
  ),
  meta: v.pipe(
    v.nullish(ComponentMetaSchema),
    v.description(
      'Metadata for the component or page, including description and test scenarios.',
    ),
  ),
})

export const ComponentSchema: v.GenericSchema<unknown, Component> = v.pipe(
  v.object({
    ...commonComponentEntries('component'),
    attributes: v.pipe(
      v.nullish(record(v.string(), ComponentAttributeSchema)),
      v.description(
        'All attributes that can be passed into the component when it is used. Attributes allow for customization and configuration of the component instance. When the value of an attribute changes, any formulas depending on it will automatically recalculate and the onAttributeChange lifecycle event is triggered.',
      ),
    ),
  }),
  v.description('Schema defining a reusable Nordcraft component.'),
)

export const PageSchema: v.GenericSchema<unknown, PageComponent> = v.pipe(
  v.object({
    ...commonComponentEntries('page'),
    attributes: v.pipe(
      v.nullish(v.object({})),
      v.description(
        'Attributes for the page (currently none). Should always be an empty object.',
      ),
    ),
    route: v.pipe(
      RouteSchema,
      v.description(
        'Route information for the page, including path segments, query parameters, and metadata such as title and description.',
      ),
    ),
  }),
  v.description('Schema defining a reusable Nordcraft component.'),
)

const shallowCommonComponentEntries = (type: 'component' | 'page') => ({
  name: v.pipe(v.string(), v.description(`Name of the ${type}`)),
  exported: v.pipe(
    v.nullish(v.boolean()),
    v.description(
      `Whether the ${type} is exported in a package project for use in other projects. Do not change this value. It should be managed by the user.`,
    ),
  ),
  nodes: v.pipe(
    v.nullish(record(v.string(), v.any())),
    v.description(
      `All nodes in the ${type}, indexed by their unique IDs. Nodes represent HTML elements, text, slots, or ${type === 'component' ? 'other components' : 'components'}. They defined the UI structure of the ${type}.`,
    ),
  ),
  variables: v.pipe(
    v.nullish(record(v.string(), v.any())),
    v.description(SCHEMA_DESCRIPTIONS.variables(type)),
  ),
  formulas: v.pipe(
    v.nullish(record(v.string(), v.any())),
    v.description(SCHEMA_DESCRIPTIONS.formulas(type)),
  ),
  workflows: v.pipe(
    v.nullish(record(v.string(), v.any())),
    v.description(SCHEMA_DESCRIPTIONS.workflows(type)),
  ),
  apis: v.pipe(
    v.nullish(record(v.string(), v.any())),
    v.description(SCHEMA_DESCRIPTIONS.apis(type)),
  ),
  events: v.pipe(
    v.nullish(v.array(v.any())),
    v.description(
      'All events this the component can emit. Events allow the component to communicate with its parent or other components. They can be triggered via actions.',
    ),
  ),
  contexts: v.pipe(
    v.nullish(record(v.string(), v.any())),
    v.description(
      'Defines which contexts this component is subscribed to. Contexts allow the component to access formulas and workflows from other components, enabling reusability and modular design.',
    ),
  ),
  onLoad: v.pipe(
    v.nullish(v.any()),
    v.description(SCHEMA_DESCRIPTIONS.onLoad(type)),
  ),
  onAttributeChange: v.pipe(
    v.nullish(v.any()),
    v.description(SCHEMA_DESCRIPTIONS.onAttributeChange(type)),
  ),
  meta: v.pipe(
    v.nullish(
      v.object({
        description: v.nullish(v.string()),
        testScenarios: v.nullish(record(v.string(), v.any())),
      }),
    ),
    v.description(
      'Metadata for the component or page, including description and test scenarios.',
    ),
  ),
})

export const ShallowComponentSchema: v.GenericSchema<unknown, Component> =
  v.pipe(
    v.object({
      ...shallowCommonComponentEntries('component'),
      attributes: v.pipe(
        v.nullish(record(v.string(), v.any())),
        v.description(
          'All attributes that can be passed into the component when it is used. Attributes allow for customization and configuration of the component instance. When the value of an attribute changes, any formulas depending on it will automatically recalculate and the onAttributeChange lifecycle event is triggered.',
        ),
      ),
    }),
    v.description('Schema defining a reusable Nordcraft component.'),
  )

export const ShallowPageSchema: v.GenericSchema<unknown, PageComponent> =
  v.pipe(
    v.object({
      ...shallowCommonComponentEntries('page'),
      attributes: v.pipe(
        v.nullish(v.any()),
        v.description(
          'Attributes for the page (currently none). Should always be an empty object.',
        ),
      ),
      route: v.pipe(
        RouteSchema,
        v.description(
          'Route information for the page, including path segments, query parameters, and metadata such as title and description.',
        ),
      ),
    }),
    v.description('Schema defining a reusable Nordcraft component.'),
  )
