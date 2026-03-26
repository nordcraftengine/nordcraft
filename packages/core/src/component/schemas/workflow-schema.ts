import { z } from 'zod'
import type { ComponentWorkflow } from '../component.types'
import { ActionModelSchema } from './action-schema'
import { MetadataSchema, SCHEMA_DESCRIPTIONS } from './zod-schemas'

export const ComponentWorkflowSchema: z.ZodType<ComponentWorkflow> = z
  .object({
    '@nordcraft/metadata': MetadataSchema.nullish().describe(
      SCHEMA_DESCRIPTIONS.metadata('workflow'),
    ),
    name: z.string().describe('Name of the workflow'),
    parameters: z
      .array(
        z.object({
          name: z.string().describe('Name of the workflow parameter'),
          testValue: z.any().describe('Test value for the workflow parameter'),
        }),
      )
      .describe('Parameters accepted by the workflow'),
    actions: z
      .array(ActionModelSchema)
      .describe('List of actions that make up the workflow'),
    exposeInContext: z
      .boolean()
      .nullish()
      .describe(
        'Indicates if the workflow should be exposed in the context for child components to subscribe to.',
      ),
  })
  .describe('Schema defining a workflow.')
