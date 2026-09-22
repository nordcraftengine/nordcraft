import * as v from 'valibot'
import type { ComponentAttribute } from '../component.types'
import { MetadataSchema, SCHEMA_DESCRIPTIONS } from './valibot-schemas'

export const ComponentAttributeSchema: v.GenericSchema<
  unknown,
  ComponentAttribute
> = v.pipe(
  v.object({
    '@nordcraft/metadata': v.pipe(
      v.nullish(MetadataSchema),
      v.description(SCHEMA_DESCRIPTIONS.metadata('component attribute')),
    ),
    name: v.pipe(v.string(), v.description('Name of the component attribute')),
    testValue: v.pipe(
      v.any(),
      v.description(SCHEMA_DESCRIPTIONS.testData('component attribute')),
    ),
  }),
  v.description('Schema for a component attribute.'),
)
