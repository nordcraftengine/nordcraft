/* eslint-disable inclusive-language/use-inclusive-words */
import { z } from 'zod'
import type { ComponentEvent, EventModel } from '../component.types'
import { ActionModelSchema } from './action-schema'
import { MetadataSchema, SCHEMA_DESCRIPTIONS } from './zod-schemas'

// Event Model
export const EventModelSchema: z.ZodType<EventModel> = z
  .lazy(() =>
    z.object({
      trigger: z
        .string()
        .describe(
          'Name of the event trigger. Nordcraft does not prefix events with "on", fx a click event is just called: "click".',
        ),
      actions: z
        .array(ActionModelSchema)
        .describe('List of actions to execute.'),
    }),
  )
  .describe(
    'Model describing an event. Events are used to define actions that should be executed in response to specific triggers, such as user interactions or lifecycle events.',
  )

export const ComponentEventSchema: z.ZodType<ComponentEvent> = z
  .object({
    '@nordcraft/metadata': MetadataSchema.optional()
      .nullable()
      .describe(SCHEMA_DESCRIPTIONS.metadata('component event')),
    name: z.string().describe('Name of the component event'),
    dummyEvent: z
      .any()
      .describe(SCHEMA_DESCRIPTIONS.testData('component event')),
  })
  .describe('Schema for a component event.')
