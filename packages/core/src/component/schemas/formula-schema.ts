import * as v from 'valibot'
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
import { MetadataSchema, SCHEMA_DESCRIPTIONS } from './valibot-schemas'

// Value Operation
const ValueOperationValueSchema: v.GenericSchema<unknown, ValueOperationValue> =
  v.union([v.string(), v.number(), v.boolean(), v.null(), v.object({})])

const ValueOperationSchema: v.GenericSchema<unknown, ValueOperation> = v.object(
  {
    '@nordcraft/metadata': v.pipe(
      v.nullish(MetadataSchema),
      v.description(SCHEMA_DESCRIPTIONS.metadata('value operation')),
    ),
    type: v.literal('value'),
    value: v.pipe(ValueOperationValueSchema, v.description('Literal value.')),
  },
)

// Path Operation
const PathOperationSchema: v.GenericSchema<unknown, PathOperation> = v.object({
  '@nordcraft/metadata': v.pipe(
    v.nullish(MetadataSchema),
    v.description(SCHEMA_DESCRIPTIONS.metadata('path operation')),
  ),
  type: v.literal('path'),
  path: v.pipe(
    v.array(v.string()),
    v.description(
      'Path segments for the path operation. Each segment is a string that corresponds to a property name or array index in the Data object passed to the system prompt.',
    ),
  ),
})

// Formula argument base
const FormulaArgumentSchema: v.GenericSchema<unknown, FunctionArgument> =
  v.pipe(
    v.object({
      formula: v.pipe(
        v.lazy(() => FormulaSchema),
        v.description('Formula for the argument.'),
      ),
      isFunction: v.pipe(
        v.nullish(v.boolean()),
        v.description(
          'Whether the argument is a function. This will be true on array formulas like map, filter, reduce, etc. formulas.',
        ),
      ),
      name: v.pipe(
        v.string(),
        v.description(
          'The name of the argument. This name corresponds to the argument name from the formula definition.',
        ),
      ),
    }),
    v.description('Argument for formulas in Nordcraft formulas.'),
  )

// Array Operation
const ArrayOperationSchema: v.GenericSchema<unknown, ArrayOperation> = v.pipe(
  v.object({
    '@nordcraft/metadata': v.pipe(
      v.nullish(MetadataSchema),
      v.description(SCHEMA_DESCRIPTIONS.metadata('array operation')),
    ),
    type: v.literal('array'),
    arguments: v.pipe(
      v.array(v.object({ formula: v.lazy(() => FormulaSchema) })),
      v.description('List of formulas for the array elements.'),
    ),
  }),
  v.description('Model for describing an array in Nordcraft formulas.'),
)

// Object Operation
const ObjectOperationSchema: v.GenericSchema<unknown, ObjectOperation> = v.pipe(
  v.object({
    '@nordcraft/metadata': v.pipe(
      v.nullish(MetadataSchema),
      v.description(SCHEMA_DESCRIPTIONS.metadata('object operation')),
    ),
    type: v.literal('object'),
    arguments: v.pipe(
      v.nullish(v.array(FormulaArgumentSchema)),
      v.description(
        'List of key-value pairs for the object. Each entry must have a name and a formula.',
      ),
    ),
  }),
  v.description('Model for describing an object in Nordcraft formulas.'),
)

// Record Operation
const RecordOperationSchema: v.GenericSchema<unknown, RecordOperation> = v.pipe(
  v.object({
    '@nordcraft/metadata': v.nullish(MetadataSchema),
    type: v.literal('record'),
    entries: v.array(FormulaArgumentSchema),
    label: v.nullish(v.string()),
  }),
  v.description('Deprecated - use Object operation instead.'),
)

// And Operation
const AndOperationSchema: v.GenericSchema<unknown, AndOperation> = v.pipe(
  v.object({
    '@nordcraft/metadata': v.pipe(
      v.nullish(MetadataSchema),
      v.description(SCHEMA_DESCRIPTIONS.metadata('AND operation')),
    ),
    type: v.literal('and'),
    arguments: v.pipe(
      v.array(v.object({ formula: v.lazy(() => FormulaSchema) })),
      v.description(
        'List of formulas to evaluate in the AND operation. All formulas must evaluate to a truthy value for the AND operation to return true.',
      ),
    ),
  }),
  v.description(
    'Model for describing a logical AND operation. The return value is a boolean value.',
  ),
)

// Or Operation
const OrOperationSchema: v.GenericSchema<unknown, OrOperation> = v.pipe(
  v.object({
    '@nordcraft/metadata': v.pipe(
      v.nullish(MetadataSchema),
      v.description(SCHEMA_DESCRIPTIONS.metadata('OR operation')),
    ),
    type: v.literal('or'),
    arguments: v.pipe(
      v.array(v.object({ formula: v.lazy(() => FormulaSchema) })),
      v.description(
        'List of formulas to evaluate in the OR operation. At least one formula must evaluate to a truthy value for the OR operation to return true.',
      ),
    ),
  }),
  v.description(
    'Model for describing a logical OR operation. The return value is a boolean value.',
  ),
)

// Switch Operation
const SwitchOperationSchema: v.GenericSchema<unknown, SwitchOperation> = v.pipe(
  v.object({
    '@nordcraft/metadata': v.nullish(MetadataSchema),
    type: v.literal('switch'),
    cases: v.pipe(
      v.array(
        v.object({
          condition: v.pipe(
            v.lazy(() => FormulaSchema),
            v.description(
              'Condition to evaluate for this case. If truthy, the formula is used.',
            ),
          ),
          formula: v.pipe(
            v.lazy(() => FormulaSchema),
            v.description('Formula to use if the condition is met.'),
          ),
        }),
      ),
      v.length(1),
      v.description(
        'Cases for the switch operation. Each case has a condition and a formula. The length of cases cannot exceed 1 at this time as the UI does not currently support this.',
      ),
    ),
    default: v.pipe(
      v.lazy(() => FormulaSchema),
      v.description('Default formula if no case matches.'),
    ),
  }),
  v.description(
    'Model for describing a switch operation. A switch operation allows branching logic based on conditions.',
  ),
)

// Project Function Operation
const ProjectFunctionOperationSchema: v.GenericSchema<
  unknown,
  FunctionOperation
> = v.pipe(
  v.object({
    '@nordcraft/metadata': v.pipe(
      v.nullish(MetadataSchema),
      v.description(SCHEMA_DESCRIPTIONS.metadata('project formula operation')),
    ),
    type: v.literal('function'),
    name: v.pipe(
      v.string(),
      v.description(
        'Key of the project formula to be called. This must match the key of the project formulas passed to the system prompt.',
      ),
    ),
    arguments: v.pipe(
      v.array(FormulaArgumentSchema),
      v.description('Formula arguments.'),
    ),
  }),
  v.description(
    'Model for describing a Project Formula operation. A Project Formula is a user-defined formula that can be reused across the project.',
  ),
)

// Built-in Function Operation
const BuiltInFunctionOperationSchema: v.GenericSchema<
  unknown,
  FunctionOperation
> = v.object({
  '@nordcraft/metadata': v.pipe(
    v.nullish(MetadataSchema),
    v.description(SCHEMA_DESCRIPTIONS.metadata('built-in formula operation')),
  ),
  type: v.literal('function'),
  name: v.pipe(
    v.string(),
    v.description(
      'Key of the built-in formula to be called. This key is always prefixed with "@toddle/" and can be read from the built-in formula definition.',
    ),
  ),
  arguments: v.pipe(
    v.array(FormulaArgumentSchema),
    v.description('Formula arguments.'),
  ),
  display_name: v.pipe(
    v.nullish(v.string()),
    v.description(
      'Human readable label for the operation. This should be set from the "name" read from the built-in formula definition.',
    ),
  ),
  variableArguments: v.pipe(
    v.nullish(v.boolean()),
    v.description(
      'Field defining if the formula accepts variable number of arguments. This value is read from the built-in formula definition.',
    ),
  ),
})

// Apply Operation
const ApplyOperationSchema: v.GenericSchema<unknown, ApplyOperation> = v.pipe(
  v.object({
    '@nordcraft/metadata': v.pipe(
      v.nullish(MetadataSchema),
      v.description(SCHEMA_DESCRIPTIONS.formulas('apply operation')),
    ),
    type: v.literal('apply'),
    name: v.pipe(
      v.string(),
      v.description(
        'Key of the formula to be applied. This is the key defined in the formulas object found in the same file.',
      ),
    ),
    arguments: v.pipe(
      v.array(FormulaArgumentSchema),
      v.description('Arguments to pass to the formula being applied.'),
    ),
  }),
  v.description(
    'Model for describing an Apply operation. An apply operation is used when a formula wants to run another formula defined in the same file.',
  ),
)

// Formula - union of all operation types
export const FormulaSchema: v.GenericSchema<unknown, Formula> = v.lazy(() =>
  v.union([
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

export const ComponentFormulaSchema: v.GenericSchema<
  unknown,
  ComponentFormula
> = v.object({
  '@nordcraft/metadata': v.pipe(
    v.nullish(MetadataSchema),
    v.description(SCHEMA_DESCRIPTIONS.metadata('formula')),
  ),
  name: v.pipe(v.string(), v.description('Name of the formula')),
  formula: v.pipe(
    FormulaSchema,
    v.description(
      'Contains the "code" that will be executed when this formula is called.',
    ),
  ),
  arguments: v.pipe(
    v.nullish(
      v.array(
        v.object({
          name: v.pipe(
            v.string(),
            v.description('Name of the formula argument'),
          ),
          testValue: v.pipe(
            v.any(),
            v.description('Test value for the formula argument'),
          ),
        }),
      ),
    ),
    v.description('List of arguments accepted by the formula.'),
  ),
  memoize: v.pipe(
    v.nullish(v.boolean()),
    v.description('Indicates if the formula result should be memoized.'),
  ),
  exposeInContext: v.pipe(
    v.nullish(v.boolean()),
    v.description(
      'Indicates if the formula should be exposed in the component context for child components to subscribe to.',
    ),
  ),
})
