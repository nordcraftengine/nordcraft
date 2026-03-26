import { z } from 'zod'
import type {
  AndOperation,
  ApplyOperation,
  ArrayOperation,
  Formula,
  FunctionArgument,
  FunctionOperation,
  ObjectOperation,
  OrOperation,
  PathOperation,
  RecordOperation,
  SwitchOperation,
  ValueOperation,
  ValueOperationValue,
} from '../../formula/formula'
import type { ComponentFormula } from '../component.types'
import { MetadataSchema, SCHEMA_DESCRIPTIONS } from './zod-schemas'

// Value Operation
const ValueOperationValueSchema: z.ZodType<ValueOperationValue> = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.object({}),
])

const ValueOperationSchema: z.ZodType<ValueOperation> = z.object({
  '@nordcraft/metadata': MetadataSchema.nullish().describe(
    SCHEMA_DESCRIPTIONS.metadata('value operation'),
  ),
  type: z.literal('value'),
  value: ValueOperationValueSchema.describe('Literal value.'),
})

// Path Operation
const PathOperationSchema: z.ZodType<PathOperation> = z.object({
  '@nordcraft/metadata': MetadataSchema.nullish().describe(
    SCHEMA_DESCRIPTIONS.metadata('path operation'),
  ),
  type: z.literal('path'),
  path: z
    .array(z.string())
    .describe(
      'Path segments for the path operation. Each segment is a string that corresponds to a property name or array index in the Data object passed to the system prompt.',
    ),
})

// Formula argument base
const FormulaArgumentSchema: z.ZodType<FunctionArgument> = z
  .object({
    get formula() {
      return FormulaSchema.describe('Formula for the argument.')
    },
    isFunction: z
      .boolean()
      .nullish()
      .describe(
        'Whether the argument is a function. This will be true on array formulas like map, filter, reduce, etc. formulas.',
      ),
    name: z
      .string()
      .describe(
        'The name of the argument. This name corresponds to the argument name from the formula definition.',
      ),
  })
  .describe('Argument for formulas in Nordcraft formulas.')

// Array Operation
const ArrayOperationSchema: z.ZodType<ArrayOperation> = z
  .object({
    '@nordcraft/metadata': MetadataSchema.nullish().describe(
      SCHEMA_DESCRIPTIONS.metadata('array operation'),
    ),
    type: z.literal('array'),
    get arguments() {
      return z
        .array(z.object({ formula: FormulaSchema }))
        .describe('List of formulas for the array elements.')
    },
  })
  .describe('Model for describing an array in Nordcraft formulas.')

// Object Operation
const ObjectOperationSchema: z.ZodType<ObjectOperation> = z
  .object({
    '@nordcraft/metadata': MetadataSchema.nullish().describe(
      SCHEMA_DESCRIPTIONS.metadata('object operation'),
    ),
    type: z.literal('object'),
    get arguments() {
      return z
        .array(FormulaArgumentSchema)
        .nullish()
        .describe(
          'List of key-value pairs for the object. Each entry must have a name and a formula.',
        )
    },
  })
  .describe('Model for describing an object in Nordcraft formulas.')

// Record Operation
const RecordOperationSchema: z.ZodType<RecordOperation> = z
  .object({
    '@nordcraft/metadata': MetadataSchema.nullish(),
    type: z.literal('record'),
    get entries() {
      return z.array(FormulaArgumentSchema)
    },
    label: z.string().nullish(),
  })
  .describe('Deprecated - use Object operation instead.')

// And Operation
const AndOperationSchema: z.ZodType<AndOperation> = z
  .object({
    '@nordcraft/metadata': MetadataSchema.nullish().describe(
      SCHEMA_DESCRIPTIONS.metadata('AND operation'),
    ),
    type: z.literal('and'),
    get arguments() {
      return z
        .array(z.object({ formula: FormulaSchema }))
        .describe(
          'List of formulas to evaluate in the AND operation. All formulas must evaluate to a truthy value for the AND operation to return true.',
        )
    },
  })
  .describe(
    'Model for describing a logical AND operation. The return value is a boolean value.',
  )

// Or Operation
const OrOperationSchema: z.ZodType<OrOperation> = z
  .object({
    '@nordcraft/metadata': MetadataSchema.nullish().describe(
      SCHEMA_DESCRIPTIONS.metadata('OR operation'),
    ),
    type: z.literal('or'),
    get arguments() {
      return z
        .array(z.object({ formula: FormulaSchema }))
        .describe(
          'List of formulas to evaluate in the OR operation. At least one formula must evaluate to a truthy value for the OR operation to return true.',
        )
    },
  })
  .describe(
    'Model for describing a logical OR operation. The return value is a boolean value.',
  )

// Switch Operation
const SwitchOperationSchema: z.ZodType<SwitchOperation> = z
  .object({
    '@nordcraft/metadata': MetadataSchema.nullish(),
    type: z.literal('switch'),
    cases: z
      .array(
        z.object({
          get condition() {
            return z
              .lazy(() => FormulaSchema)
              .describe(
                'Condition to evaluate for this case. If truthy, the formula is used.',
              )
          },
          get formula() {
            return z
              .lazy(() => FormulaSchema)
              .describe('Formula to use if the condition is met.')
          },
        }),
      )
      .length(1)
      .describe(
        'Cases for the switch operation. Each case has a condition and a formula. The length of cases cannot exceed 1 at this time as the UI does not currently support this.',
      ),
    get default() {
      return FormulaSchema.describe('Default formula if no case matches.')
    },
  })
  .describe(
    'Model for describing a switch operation. A switch operation allows branching logic based on conditions.',
  )

// Project Function Operation
const ProjectFunctionOperationSchema: z.ZodType<FunctionOperation> = z
  .object({
    '@nordcraft/metadata': MetadataSchema.nullish().describe(
      SCHEMA_DESCRIPTIONS.metadata('project formula operation'),
    ),
    type: z.literal('function'),
    name: z
      .string()
      .describe(
        'Key of the project formula to be called. This must match the key of the project formulas passed to the system prompt.',
      ),
    get arguments() {
      return z.array(FormulaArgumentSchema).describe('Formula arguments.')
    },
  })
  .describe(
    'Model for describing a Project Formula operation. A Project Formula is a user-defined formula that can be reused across the project.',
  )

// Built-in Function Operation
const BuiltInFunctionOperationSchema: z.ZodType<FunctionOperation> = z.object({
  '@nordcraft/metadata': MetadataSchema.nullish().describe(
    SCHEMA_DESCRIPTIONS.metadata('built-in formula operation'),
  ),
  type: z.literal('function'),
  name: z
    .string()
    .describe(
      'Key of the built-in formula to be called. This key is always prefixed with "@toddle/" and can be read from the built-in formula definition.',
    ),
  get arguments() {
    return z.array(FormulaArgumentSchema).describe('Formula arguments.')
  },
  display_name: z
    .string()
    .nullish()
    .describe(
      'Human readable label for the operation. This should be set from the "name" read from the built-in formula definition.',
    ),
  variableArguments: z
    .boolean()
    .nullish()
    .describe(
      'Field defining if the formula accepts variable number of arguments. This value is read from the built-in formula definition.',
    ),
})

// Apply Operation
const ApplyOperationSchema: z.ZodType<ApplyOperation> = z
  .object({
    '@nordcraft/metadata': MetadataSchema.nullish().describe(
      SCHEMA_DESCRIPTIONS.formulas('apply operation'),
    ),
    type: z.literal('apply'),
    name: z
      .string()
      .describe(
        'Key of the formula to be applied. This is the key defined in the formulas object found in the same file.',
      ),
    arguments: z
      .array(FormulaArgumentSchema)
      .describe('Arguments to pass to the formula being applied.'),
  })
  .describe(
    'Model for describing an Apply operation. An apply operation is used when a formula wants to run another formula defined in the same file.',
  )

// Formula - union of all operation types
export const FormulaSchema: z.ZodType<Formula> = z.lazy(() =>
  z.union([
    BuiltInFunctionOperationSchema,
    ProjectFunctionOperationSchema,
    RecordOperationSchema,
    ObjectOperationSchema,
    ArrayOperationSchema,
    PathOperationSchema,
    SwitchOperationSchema,
    OrOperationSchema,
    AndOperationSchema,
    ValueOperationSchema,
    ApplyOperationSchema,
  ]),
)

export const ComponentFormulaSchema: z.ZodType<ComponentFormula> = z.object({
  '@nordcraft/metadata': MetadataSchema.nullish().describe(
    SCHEMA_DESCRIPTIONS.metadata('formula'),
  ),
  name: z.string().describe('Name of the formula'),
  formula: FormulaSchema.describe(
    'Contains the "code" that will be executed when this formula is called.',
  ),
  arguments: z
    .array(
      z.object({
        name: z.string().describe('Name of the formula argument'),
        testValue: z.any().describe('Test value for the formula argument'),
      }),
    )
    .nullish()
    .describe('List of arguments accepted by the formula.'),
  memoize: z
    .boolean()
    .nullish()
    .describe('Indicates if the formula result should be memoized.'),
  exposeInContext: z
    .boolean()
    .nullish()
    .describe(
      'Indicates if the formula should be exposed in the component context for child components to subscribe to.',
    ),
})
