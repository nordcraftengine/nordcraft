import * as v from 'valibot'
import type { ComponentEvent, EventModel } from '../component.types'
import { ActionModelSchema } from './action-schema'
import { MetadataSchema, SCHEMA_DESCRIPTIONS } from './valibot-schemas'

// Event Model
export const EventModelSchema: v.GenericSchema<unknown, EventModel> = v.pipe(
  v.lazy(() =>
    v.object({
      trigger: v.pipe(
        v.string(),
        v.description(
          'Name of the event trigger. Nordcraft does not prefix events with "on", fx a click event is just called: "click".',
        ),
      ),
      actions: v.pipe(
        v.array(ActionModelSchema),
        v.description('List of actions to execute.'),
      ),
    }),
  ),
  v.description(
    'Model describing an event. Events are used to define actions that should be executed in response to specific triggers, such as user interactions or lifecycle events.',
  ),
)

export const ComponentEventSchema: v.GenericSchema<unknown, ComponentEvent> =
  v.pipe(
    v.object({
      '@nordcraft/metadata': v.pipe(
        v.nullish(MetadataSchema),
        v.description(SCHEMA_DESCRIPTIONS.metadata('component event')),
      ),
      name: v.pipe(v.string(), v.description('Name of the component event')),
      dummyEvent: v.pipe(
        v.any(),
        v.description(SCHEMA_DESCRIPTIONS.testData('component event')),
      ),
    }),
    v.description('Schema for a component event.'),
  )
