import type { ComponentVariable } from '@nordcraft/core'
import * as v from 'valibot'
import { FormulaSchema } from './formula-schema'
import { MetadataSchema, SCHEMA_DESCRIPTIONS } from './valibot-schemas'

export const ComponentVariableSchema: v.GenericSchema<
  unknown,
  ComponentVariable
> = v.object({
  '@nordcraft/metadata': v.pipe(
    v.nullish(MetadataSchema),
    v.description(SCHEMA_DESCRIPTIONS.metadata('variable')),
  ),
  initialValue: v.pipe(
    FormulaSchema,
    v.description('Initial value of the variable'),
  ),
})
