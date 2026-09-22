import * as v from 'valibot'
import type { ComponentWorkflow } from '../component.types'
import { ActionModelSchema } from './action-schema'
import { MetadataSchema, SCHEMA_DESCRIPTIONS } from './valibot-schemas'

export const ComponentWorkflowSchema: v.GenericSchema<
  unknown,
  ComponentWorkflow
> = v.pipe(
  v.object({
    '@nordcraft/metadata': v.pipe(
      v.nullish(MetadataSchema),
      v.description(SCHEMA_DESCRIPTIONS.metadata('workflow')),
    ),
    name: v.pipe(v.string(), v.description('Name of the workflow')),
    parameters: v.pipe(
      v.array(
        v.object({
          name: v.pipe(
            v.string(),
            v.description('Name of the workflow parameter'),
          ),
          testValue: v.pipe(
            v.any(),
            v.description('Test value for the workflow parameter'),
          ),
        }),
      ),
      v.description('Parameters accepted by the workflow'),
    ),
    actions: v.pipe(
      v.array(ActionModelSchema),
      v.description('List of actions that make up the workflow'),
    ),
    exposeInContext: v.pipe(
      v.nullish(v.boolean()),
      v.description(
        'Indicates if the workflow should be exposed in the context for child components to subscribe to.',
      ),
    ),
  }),
  v.description('Schema defining a workflow.'),
)
