import { z } from 'zod'
import type { ComponentAttribute } from '../component.types'
import { MetadataSchema, SCHEMA_DESCRIPTIONS } from './zod-schemas'

export const ComponentAttributeSchema: z.ZodType<ComponentAttribute> = z
  .object({
    '@nordcraft/metadata': MetadataSchema.nullish().describe(
      SCHEMA_DESCRIPTIONS.metadata('component attribute'),
    ),
    name: z.string().describe('Name of the component attribute'),
    testValue: z
      .any()
      .describe(SCHEMA_DESCRIPTIONS.testData('component attribute')),
  })
  .describe('Schema for a component attribute.')
