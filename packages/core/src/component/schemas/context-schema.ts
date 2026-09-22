import * as v from 'valibot'
import type { ComponentContext } from '../component.types'

export const ComponentContextSchema: v.GenericSchema<
  unknown,
  ComponentContext
> = v.pipe(
  v.object({
    package: v.pipe(
      v.nullish(v.string()),
      v.description('Package name of the component providing the context'),
    ),
    componentName: v.pipe(
      v.nullish(v.string()),
      v.description('Name of the component providing the context'),
    ),
    formulas: v.pipe(
      v.array(v.string()),
      v.description('Names of the formulas from the context to subscribe to'),
    ),
    workflows: v.pipe(
      v.array(v.string()),
      v.description('Names of the workflows from the context to subscribe to'),
    ),
  }),
  v.description('Schema defining a component context subscription.'),
)
