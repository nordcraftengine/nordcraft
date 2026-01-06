import { z } from 'zod'
import type { ComponentVariable } from '../component.types'
import { FormulaSchema } from './formula-schema'
import { MetadataSchema, SCHEMA_DESCRIPTIONS } from './zod-schemas'

export const ComponentVariableSchema: z.ZodType<ComponentVariable> = z.object({
  '@nordcraft/metadata': MetadataSchema.optional()
    .nullable()
    .describe(SCHEMA_DESCRIPTIONS.metadata('variable')),
  initialValue: FormulaSchema.describe('Initial value of the variable'),
})
