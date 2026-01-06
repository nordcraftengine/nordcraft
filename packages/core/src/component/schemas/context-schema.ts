import { z } from 'zod'
import type { ComponentContext } from '../component.types'

export const ComponentContextSchema: z.ZodType<ComponentContext> = z
  .object({
    package: z
      .string()
      .optional()
      .nullable()
      .describe('Package name of the component providing the context'),
    componentName: z
      .string()
      .optional()
      .nullable()
      .describe('Name of the component providing the context'),
    formulas: z
      .array(z.string())
      .describe('Names of the formulas from the context to subscribe to'),
    workflows: z
      .array(z.string())
      .describe('Names of the workflows from the context to subscribe to'),
  })
  .describe('Schema defining a component context subscription.')
