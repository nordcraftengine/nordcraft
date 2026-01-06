import { z } from 'zod'
import type { Component, PageComponent } from '../component.types'
import { ActionModelSchema } from './action-schema'
import { ComponentAPISchema } from './api-schema'
import { ComponentAttributeSchema } from './attribute-schema'
import { ComponentContextSchema } from './context-schema'
import { ComponentEventSchema } from './event-schema'
import { ComponentFormulaSchema } from './formula-schema'
import { NodeModelSchema } from './node-schema'
import { RouteSchema } from './route-schema'
import { ComponentVariableSchema } from './variable-schema'
import { ComponentWorkflowSchema } from './workflow-schema'
import { SCHEMA_DESCRIPTIONS } from './zod-schemas'

const commonComponentSchema = (type: 'component' | 'page') =>
  z
    .object({
      name: z.string().describe(`Name of the ${type}`),
      exported: z
        .boolean()
        .optional()
        .nullable()
        .describe(
          `Whether the ${type} is exported in a package project for use in other projects. Do not change this value. It should be managed by the user.`,
        ),
      nodes: z
        .record(z.string(), NodeModelSchema)
        .optional()
        .nullable()
        .describe(
          `All nodes in the ${type}, indexed by their unique IDs. Nodes represent HTML elements, text, slots, or ${type === 'component' ? 'other components' : 'components'}. They defined the UI structure of the ${type}.`,
        ),
      variables: z
        .record(z.string(), ComponentVariableSchema)
        .optional()
        .nullable()
        .describe(SCHEMA_DESCRIPTIONS.variables(type)),
      formulas: z
        .record(z.string(), ComponentFormulaSchema)
        .optional()
        .nullable()
        .describe(SCHEMA_DESCRIPTIONS.formulas(type)),
      workflows: z
        .record(z.string(), ComponentWorkflowSchema)
        .optional()
        .nullable()
        .describe(SCHEMA_DESCRIPTIONS.workflows(type)),
      apis: z
        .record(z.string(), ComponentAPISchema)
        .optional()
        .nullable()
        .describe(SCHEMA_DESCRIPTIONS.apis(type)),
      events: z
        .array(ComponentEventSchema)
        .optional()
        .nullable()
        .describe(
          'All events this the component can emit. Events allow the component to communicate with its parent or other components. They can be triggered via actions.',
        ),
      contexts: z
        .record(z.string(), ComponentContextSchema)
        .optional()
        .nullable()
        .describe(
          'Defines which contexts this component is subscribed to. Contexts allow the component to access formulas and workflows from other components, enabling reusability and modular design.',
        ),
      onLoad: z
        .object({
          trigger: z.literal('Load'),
          actions: z.array(ActionModelSchema),
        })
        .optional()
        .nullable()
        .describe(SCHEMA_DESCRIPTIONS.onLoad(type)),
      onAttributeChange: z
        .object({
          trigger: z.literal('Attribute change'),
          actions: z.array(ActionModelSchema),
        })
        .optional()
        .nullable()
        .describe(SCHEMA_DESCRIPTIONS.onAttributeChange(type)),
    })
    .describe('Schema defining a reusable Nordcraft component.')

export const ComponentSchema: z.ZodType<Component> = commonComponentSchema(
  'component',
).extend({
  attributes: z
    .record(z.string(), ComponentAttributeSchema)
    .optional()
    .nullable()
    .describe(
      'All attributes that can be passed into the component when it is used. Attributes allow for customization and configuration of the component instance. When the value of an attribute changes, any formulas depending on it will automatically recalculate and the onAttributeChange lifecycle event is triggered.',
    ),
})

export const PageSchema: z.ZodType<PageComponent> = commonComponentSchema(
  'page',
).extend({
  attributes: z
    .object({})
    .optional()
    .nullable()
    .describe(
      'Attributes for the page (currently none). Should always be an empty object.',
    ),
  route: RouteSchema.describe(
    'Route information for the page, including path segments, query parameters, and metadata such as title and description.',
  ),
})

const shallowCommonComponentSchema = (type: 'component' | 'page') =>
  z
    .object({
      name: z.string().describe(`Name of the ${type}`),
      exported: z
        .boolean()
        .optional()
        .nullable()
        .describe(
          `Whether the ${type} is exported in a package project for use in other projects. Do not change this value. It should be managed by the user.`,
        ),
      nodes: z
        .record(z.string(), z.any())
        .optional()
        .nullable()
        .describe(
          `All nodes in the ${type}, indexed by their unique IDs. Nodes represent HTML elements, text, slots, or ${type === 'component' ? 'other components' : 'components'}. They defined the UI structure of the ${type}.`,
        ),
      variables: z
        .record(z.string(), z.any())
        .optional()
        .nullable()
        .describe(SCHEMA_DESCRIPTIONS.variables(type)),
      formulas: z
        .record(z.string(), z.any())
        .optional()
        .nullable()
        .describe(SCHEMA_DESCRIPTIONS.formulas(type)),
      workflows: z
        .record(z.string(), z.any())
        .optional()
        .nullable()
        .describe(SCHEMA_DESCRIPTIONS.workflows(type)),
      apis: z
        .record(z.string(), z.any())
        .optional()
        .nullable()
        .describe(SCHEMA_DESCRIPTIONS.apis(type)),
      events: z
        .array(z.any())
        .optional()
        .nullable()
        .describe(
          'All events this the component can emit. Events allow the component to communicate with its parent or other components. They can be triggered via actions.',
        ),
      contexts: z
        .record(z.string(), z.any())
        .optional()
        .nullable()
        .describe(
          'Defines which contexts this component is subscribed to. Contexts allow the component to access formulas and workflows from other components, enabling reusability and modular design.',
        ),
      onLoad: z
        .any()
        .optional()
        .nullable()
        .describe(SCHEMA_DESCRIPTIONS.onLoad(type)),
      onAttributeChange: z
        .any()
        .optional()
        .nullable()
        .describe(SCHEMA_DESCRIPTIONS.onAttributeChange(type)),
    })
    .describe('Schema defining a reusable Nordcraft component.')

export const ShallowComponentSchema: z.ZodType<Component> =
  shallowCommonComponentSchema('component').extend({
    attributes: z
      .record(z.string(), z.any())
      .optional()
      .nullable()
      .describe(
        'All attributes that can be passed into the component when it is used. Attributes allow for customization and configuration of the component instance. When the value of an attribute changes, any formulas depending on it will automatically recalculate and the onAttributeChange lifecycle event is triggered.',
      ),
  })

export const ShallowPageSchema: z.ZodType<PageComponent> =
  shallowCommonComponentSchema('page').extend({
    attributes: z
      .any()
      .optional()
      .nullable()
      .describe(
        'Attributes for the page (currently none). Should always be an empty object.',
      ),
    route: RouteSchema.describe(
      'Route information for the page, including path segments, query parameters, and metadata such as title and description.',
    ),
  })
