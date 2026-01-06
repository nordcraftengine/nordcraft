/* eslint-disable inclusive-language/use-inclusive-words */
import { z } from 'zod'
import type {
  ApiParserMode,
  ApiRequest,
  ComponentAPI,
  LegacyComponentAPI,
} from '../../api/apiTypes'
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
import type { StyleTokenCategory } from '../../styling/theme'
import type { StyleVariant } from '../../styling/variantSelector'
import type {
  ActionModel,
  AnimationKeyframe,
  Component,
  ComponentAttribute,
  ComponentContext,
  ComponentEvent,
  ComponentFormula,
  ComponentNodeModel,
  ComponentVariable,
  ComponentWorkflow,
  CustomActionModel,
  DynamicPathSegment,
  ElementNodeModel,
  EventActionModel,
  EventModel,
  FetchActionModel,
  MetaEntry,
  NodeModel,
  NodeStyleModel,
  PageComponent,
  RouteDeclaration,
  SetMultiUrlParameterAction,
  SetURLParameterAction,
  SlotNodeModel,
  StaticPathSegment,
  SwitchActionModel,
  TextNodeModel,
  VariableActionModel,
  WorkflowActionModel,
} from '../component.types'

const generalDescriptions = {
  animations: (type: string) => `Animations defined on this ${type}`,
  animationKey: `Unique key identifying the animation. This should be globally unique. Prefix with the name of the file to ensure uniqueness. Fx "myComponent-fadeIn"`,
  animationKeyframeKey: `Unique key identifying the keyframe`,
  apis: (type: string) =>
    `All APIs defined in the ${type}. APIs are used to fetch data from external services or backend systems. They can be called via actions and their data can be used in formulas.`,
  children: `A list of child node IDs. Every ID must correspond to a node defined in the "nodes" object of the component/page that includes this component node.`,
  condition: (type: string) =>
    `Formula evaluating to whether this ${type} is rendered or not. If false, undefined or null the ${type} is not rendered. Any other value means the ${type} is rendered.`,
  formulas: (type: string) =>
    `All formulas defined in the ${type}. Formulas are used to compute dynamic values based on variables, inputs, or other data.`,
  metadata: (type: string) =>
    `Metadata associated with this ${type}. This can include comments and other information useful for understanding the ${type}.`,
  onAttributeChange: (type: string) =>
    `Lifecycle event that is triggered when any of the ${type} attributes change. Declared actions will be executed in response to attribute changes, allowing the ${type} to react dynamically to different configurations.`,
  onLoad: (type: string) =>
    `Lifecycle event that is triggered when the ${type} is loaded. Declared actions will be executed when the ${type} loads, such as initializing variables or fetching data.`,
  repeat: (type: string) =>
    `Formula evaluating to an array of items to repeat this ${type} for.`,
  repeatKey: (type: string) =>
    `A Formula evaluating to a unique key for each repeated item. This is important for ensuring that the ${type} instances are correctly identified and managed during re-renders. This is rarely needed for simple arrays but is critical when rendering complex objects or when the array items can change dynamically.`,
  slot: (type: string) =>
    `Slot name for when this ${type} is rendered inside a component. Slot name must match the slot defined in the parent component. The default slot name is: "default".`,
  style: (type: string) => `This is the default style for this ${type}.`,
  testData: (type: string) =>
    `Test value for the ${type}. Test data is only used while building in the Nordcraft editor.`,
  variables: (type: string) =>
    `All variables defined in the ${type}. Variables hold dynamic data that can be used throughout the ${type} via formulas. They can be updated via actions.`,
  variants: (type: string) =>
    `Style variants defined on this ${type}. This could be a variant for hover, active, focus, media queries, or other state-based styles. Or even based on a class.`,
  workflows: (type: string) =>
    `All workflows defined in the ${type}. Workflows are sequences of actions that can be triggered by events or other workflows. They define the behavior of the ${type}.`,
}

// Base metadata schema used throughout
const MetadataSchema = z
  .object({
    comments: z
      .record(
        z.string(),
        z.object({
          index: z.number(),
          text: z.string(),
        }),
      )
      .nullable(),
  })
  .nullable()

// Value Operation
const ValueOperationValueSchema: z.ZodType<ValueOperationValue> = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.object({}),
])

const ValueOperationSchema: z.ZodType<ValueOperation> = z.object({
  '@nordcraft/metadata': MetadataSchema.optional()
    .nullable()
    .describe(generalDescriptions.metadata('value operation')),
  type: z.literal('value'),
  value: ValueOperationValueSchema.describe('Literal value.'),
})

// Path Operation
const PathOperationSchema: z.ZodType<PathOperation> = z.object({
  '@nordcraft/metadata': MetadataSchema.optional()
    .nullable()
    .describe(generalDescriptions.metadata('path operation')),
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
      .optional()
      .nullable()
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
    '@nordcraft/metadata': MetadataSchema.optional()
      .nullable()
      .describe(generalDescriptions.metadata('array operation')),
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
    '@nordcraft/metadata': MetadataSchema.optional()
      .nullable()
      .describe(generalDescriptions.metadata('object operation')),
    type: z.literal('object'),
    get arguments() {
      return z
        .array(FormulaArgumentSchema)
        .optional()
        .nullable()
        .describe(
          'List of key-value pairs for the object. Each entry must have a name and a formula.',
        )
    },
  })
  .describe('Model for describing an object in Nordcraft formulas.')

// Record Operation
const RecordOperationSchema: z.ZodType<RecordOperation> = z
  .object({
    '@nordcraft/metadata': MetadataSchema.optional().nullable(),
    type: z.literal('record'),
    get entries() {
      return z.array(FormulaArgumentSchema)
    },
    label: z.string().optional().nullable(),
  })
  .describe('Deprecated - use Object operation instead.')

// And Operation
const AndOperationSchema: z.ZodType<AndOperation> = z
  .object({
    '@nordcraft/metadata': MetadataSchema.optional()
      .nullable()
      .describe(generalDescriptions.metadata('AND operation')),
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
    '@nordcraft/metadata': MetadataSchema.optional()
      .nullable()
      .describe(generalDescriptions.metadata('OR operation')),
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
    '@nordcraft/metadata': MetadataSchema.optional().nullable(),
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
    '@nordcraft/metadata': MetadataSchema.optional()
      .nullable()
      .describe(generalDescriptions.metadata('project formula operation')),
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
  '@nordcraft/metadata': MetadataSchema.optional()
    .nullable()
    .describe(generalDescriptions.metadata('built-in formula operation')),
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
    .nullable()
    .describe(
      'Human readable label for the operation. This should be set from the "name" read from the built-in formula definition.',
    ),
  variableArguments: z
    .boolean()
    .optional()
    .nullable()
    .describe(
      'Field defining if the formula accepts variable number of arguments. This value is read from the built-in formula definition.',
    ),
})

// Apply Operation
const ApplyOperationSchema: z.ZodType<ApplyOperation> = z
  .object({
    '@nordcraft/metadata': MetadataSchema.optional()
      .nullable()
      .describe(generalDescriptions.formulas('apply operation')),
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
const FormulaSchema: z.ZodType<Formula> = z.lazy(() =>
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

// Event Model
const EventModelSchema: z.ZodType<EventModel> = z
  .lazy(() =>
    z.object({
      trigger: z
        .string()
        .describe(
          'Name of the event trigger. Nordcraft does not prefix events with "on", fx a click event is just called: "click".',
        ),
      actions: z
        .array(ActionModelSchema)
        .describe('List of actions to execute.'),
    }),
  )
  .describe(
    'Model describing an event. Events are used to define actions that should be executed in response to specific triggers, such as user interactions or lifecycle events.',
  )

// Action Models
const VariableActionModelSchema: z.ZodType<VariableActionModel> = z
  .object({
    type: z.literal('SetVariable'),
    variable: z.string().describe('Name of the variable to be set.'),
    data: FormulaSchema.describe(
      'Formula evaluating to the new variable value.',
    ),
  })
  .describe('Model describing the action of setting a variable.')

const EventActionModelSchema: z.ZodType<EventActionModel> = z
  .object({
    type: z.literal('TriggerEvent'),
    event: z.string().describe('Name of the event to be triggered.'),
    data: FormulaSchema.describe('Data to pass to the event being triggered.'),
  })
  .describe(
    'Model describing the action of triggering an event. This is only relevant on components as they are the only entities that can have events defined.',
  )

const SwitchActionModelSchema: z.ZodType<SwitchActionModel> = z
  .object({
    type: z.literal('Switch'),
    cases: z
      .array(
        z.object({
          condition: FormulaSchema.describe(
            'Condition to evaluate for this case. If truthy the actions are executed.',
          ),
          actions: z
            .array(z.lazy(() => ActionModelSchema))
            .describe('List of actions to execute if the condition is met.'),
        }),
      )
      .describe(
        'Cases for the switch action. Each case has a condition and actions.',
      ),
    default: z
      .object({
        actions: z.array(z.lazy(() => ActionModelSchema)),
      })
      .describe('Actions to execute if no case conditions are met.'),
  })
  .describe(
    'Model describing a switch action. A switch action allows branching logic based on conditions.',
  )

const FetchActionModelSchema: z.ZodType<FetchActionModel> = z
  .object({
    type: z.literal('Fetch'),
    api: z
      .string()
      .describe(
        'Key of the API to fetch data from. This is the key defined in the APIs object in the file.',
      ),
    inputs: z
      .record(
        z.string().describe('Name of the API input.'),
        z.object({
          formula: FormulaSchema.nullable().describe('Formula for the input.'),
        }),
      )
      .describe(
        'Inputs overriding the default input values for the API. Available inputs are defined as part of the API definition.',
      ),
    onSuccess: z
      .object({
        actions: z.array(z.lazy(() => ActionModelSchema)),
      })
      .describe('Actions to execute when the fetch is successful.'),
    onError: z
      .object({
        actions: z.array(z.lazy(() => ActionModelSchema)),
      })
      .describe('Actions to execute when the fetch fails.'),
    onMessage: z
      .object({
        actions: z.array(z.lazy(() => ActionModelSchema)),
      })
      .optional()
      .nullable()
      .describe(
        'Actions to execute when a message is received during streaming.',
      ),
  })
  .describe('Model describing the action of fetching data from an API.')

const CustomActionModelSchema: z.ZodType<CustomActionModel> = z
  .object({
    type: z.literal('Custom'),
    name: z.string().describe('Name of the custom action to be executed.'),
    package: z
      .string()
      .optional()
      .nullable()
      .describe(
        'Package where the custom action is defined. Should not be set for local custom actions.',
      ),
    arguments: z
      .array(
        z.object({
          name: z.string().describe('Name of the argument.'),
          formula: FormulaSchema.describe(
            'Formula evaluating to the argument value.',
          ),
        }),
      )
      .optional()
      .nullable()
      .describe('Arguments to pass to the custom action.'),
    events: z
      .record(
        z.string().describe('Name of the event.'),
        z
          .object({
            actions: z
              .array(z.lazy(() => ActionModelSchema))
              .describe(
                'List of actions to execute when the event is triggered.',
              ),
          })
          .describe(
            'Record with one entry called "actions" which is a list of actions to execute when the event is triggered..',
          ),
      )
      .optional()
      .nullable()
      .describe(
        'Record of events defined in the custom action. Each event has a list of actions to execute when the event is emitted.',
      ),
    version: z
      .literal(2)
      .optional()
      .nullable()
      .describe('Version of the custom action model. This should always be 2.'),
  })
  .describe(
    'Model describing the action of a custom action. A custom action is a user-defined action that can be reused across the project. A list of available custom actions has been provided as part of the system prompt.',
  )

const BuiltInActionModelSchema: z.ZodType<CustomActionModel> = z
  .object({
    name: z
      .string()
      .describe(
        'Name of the built-in action. This will always be prefixed with "@toddle/" and should match the action key in the system.',
      ),
    arguments: z
      .array(
        z.object({
          name: z.string().describe('Name of the argument.'),
          formula: FormulaSchema.describe(
            'Formula evaluating to the argument value.',
          ),
        }),
      )
      .optional()
      .nullable()
      .describe('Arguments to pass to the built-in action.'),
    events: z
      .record(
        z.string().describe('Name of the event.'),
        z
          .object({
            actions: z.array(z.lazy(() => ActionModelSchema)),
          })
          .describe('List of actions to execute when the event is triggered.'),
      )
      .optional()
      .nullable()
      .describe(
        'Events that can be triggered by the built-in action. Common events include onSuccess and onError.',
      ),
    label: z
      .string()
      .describe(
        'Label for the built-in action. This label will be used in the UI.',
      ),
  })
  .describe(
    'Model describing a built-in action provided by the Nordcraft system. Built-in actions are pre-defined actions that can be used to perform common tasks within a Nordcraft project.',
  )

const SetURLParameterActionSchema: z.ZodType<SetURLParameterAction> = z
  .object({
    type: z.literal('SetURLParameter'),
    parameter: z.string(),
    data: FormulaSchema,
    historyMode: z.enum(['replace', 'push']).nullable().optional().nullable(),
  })
  .describe(
    'This model is deprecated. Instead refer to SetMultiUrlParameterActionSchema.',
  )

const SetMultiUrlParameterActionSchema: z.ZodType<SetMultiUrlParameterAction> =
  z
    .object({
      type: z.literal('SetURLParameters'),
      parameters: z
        .record(z.string(), FormulaSchema)
        .describe(
          'Record of URL parameters to set, where the key is the parameter name and the value is a formula evaluating to the parameter value.',
        ),
      historyMode: z
        .enum(['replace', 'push'])
        .nullable()
        .optional()
        .nullable()
        .describe(
          'This determines how the URL is updated in the browser history. Use "replace" to update the current history entry without adding a new one, or "push" to create a new history entry for the URL change. If not specified, the default behavior is to use "push".',
        ),
    })
    .describe(
      'Model describing the action of setting multiple URL parameters. Use this action to update any number (1-*) of URL parameter(s) in one go.',
    )

const WorkflowActionModelSchema: z.ZodType<WorkflowActionModel> = z
  .object({
    type: z.literal('TriggerWorkflow'),
    workflow: z.string().describe('ID of the workflow to be triggered.'),
    parameters: z
      .record(
        z.string().describe('Name of the workflow parameter.'),
        z
          .object({
            formula: FormulaSchema,
          })
          .describe('Formula evaluating to the parameter value.'),
      )
      .describe('Parameters to pass to the workflow being triggered. '),
    contextProvider: z
      .string()
      .optional()
      .nullable()
      .describe(
        'If the workflow being triggered is from a parent component and exposed via a context provider, this is the ID of that context provider.',
      ),
  })
  .describe('Model describing the action of triggering a workflow.')

const ActionModelSchema: z.ZodType<ActionModel> = z.lazy(() =>
  z.union([
    VariableActionModelSchema,
    EventActionModelSchema,
    SwitchActionModelSchema,
    FetchActionModelSchema,
    CustomActionModelSchema,
    SetURLParameterActionSchema,
    SetMultiUrlParameterActionSchema,
    WorkflowActionModelSchema,
    BuiltInActionModelSchema,
  ]),
)

// Style and Animation
const NodeStyleModelSchema: z.ZodType<NodeStyleModel> = z.record(
  z.string(),
  z.string(),
)

const AnimationKeyframeSchema: z.ZodType<AnimationKeyframe> = z.object({
  position: z
    .number()
    .describe(
      "Value between 0 and 1 representing the keyframe's position in the animation",
    ),
  key: z.string().describe('CSS property to be animated'),
  value: z.string().describe('Value of the CSS property at this keyframe'),
})

const StyleTokenCategorySchema: z.ZodType<StyleTokenCategory> = z.enum([
  'spacing',
  'color',
  'font-size',
  'font-weight',
  'z-index',
  'border-radius',
  'shadow',
])

const StyleVariantSchema: z.ZodType<StyleVariant> = z.object({
  style: NodeStyleModelSchema,
  id: z.string().optional().nullable(),
  className: z.string().optional().nullable(),
  hover: z.boolean().optional().nullable(),
  active: z.boolean().optional().nullable(),
  focus: z.boolean().optional().nullable(),
  focusWithin: z.boolean().optional().nullable(),
  disabled: z.boolean().optional().nullable(),
  empty: z.boolean().optional().nullable(),
  firstChild: z.boolean().optional().nullable(),
  lastChild: z.boolean().optional().nullable(),
  evenChild: z.boolean().optional().nullable(),
  startingStyle: z.boolean().optional().nullable(),
  mediaQuery: z
    .object({
      'min-width': z.string().optional().nullable(),
      'max-width': z.string().optional().nullable(),
      'min-height': z.string().optional().nullable(),
      'max-height': z.string().optional().nullable(),
      'prefers-reduced-motion': z.enum(['reduce', 'no-preference']).optional().nullable(),
    })
    .optional()
    .nullable(),
})

// Node Models
const TextNodeModelSchema: z.ZodType<TextNodeModel> = z
  .object({
    type: z.literal('text'),
    value: FormulaSchema.describe('Formula evaluating to the text content.'),
    condition: FormulaSchema.optional()
      .nullable()
      .describe(generalDescriptions.condition('text node')),
    repeat: FormulaSchema.optional()
      .nullable()
      .describe(generalDescriptions.repeat('text node')),
    repeatKey: FormulaSchema.optional()
      .nullable()
      .describe(generalDescriptions.repeatKey('text node')),
    slot: z
      .string()
      .optional()
      .nullable()
      .describe(generalDescriptions.slot('text node')),
  })
  .describe(
    'Schema defining a Text Node Model. A text node represents text content inside of an element.',
  )

const SlotNodeModelSchema: z.ZodType<SlotNodeModel> = z
  .object({
    type: z.literal('slot'),
    children: z
      .array(z.string())
      .describe(
        `${generalDescriptions.children}. These are the default child nodes for the slot. If no content is passed to the slot when used inside a component, these default child nodes will be rendered.`,
      ),
    name: z
      .string()
      .optional()
      .nullable()
      .describe(
        'Name of the slot. This is the name that must be used when passing content to this slot.',
      ),
    condition: FormulaSchema.optional()
      .nullable()
      .describe(generalDescriptions.condition('slot node')),
    slot: z
      .string()
      .optional()
      .nullable()
      .describe(generalDescriptions.slot('slot node')),
  })
  .describe(
    'Schema defining a Slot Node Model. A slot is a placeholder for child nodes. Slot nodes can only exist inside components.',
  )

const ElementNodeModelSchema: z.ZodType<ElementNodeModel> = z
  .object({
    type: z.literal('element'),
    tag: z
      .string()
      .describe(
        'The HTML tag of the element node, such as "div", "span", "img", "a", etc.',
      ),
    attrs: z
      .record(z.string(), FormulaSchema)
      .describe(
        'Attributes of the element node such as "src", "alt", "href", or any other attribute that is applicable to the corresponding HTML element.',
      ),
    style: NodeStyleModelSchema.describe(
      generalDescriptions.style('element node'),
    ),
    children: z.array(z.string()).describe(generalDescriptions.children),
    events: z
      .record(z.string(), EventModelSchema)
      .describe(
        'Events on the element node such as "click", "hover", or any other event that is applicable to the corresponding HTML element.',
      ),
    classes: z
      .record(
        z.string().describe('The class name'),
        z
          .object({ formula: FormulaSchema.optional().nullable() })
          .describe(
            'Formula that will determine when the class is applied. The class is applied when the formula is truthy.',
          ),
      )
      .describe('Classes applied to this element node.'),
    'style-variables': z
      .array(
        z.object({
          category: StyleTokenCategorySchema.describe(
            'Category of the style token.',
          ),
          name: z.string().describe('Name of the style token.'),
          formula: FormulaSchema.describe(
            'Formula defining the value of the token.',
          ),
          unit: z
            .string()
            .optional()
            .nullable()
            .describe('Unit of the style token, if applicable.'),
        }),
      )
      .optional()
      .nullable()
      .describe(
        'Style variables defined on this element node. Style variables can be used to define design tokens such as colors, spacing, font sizes, and other reusable style values.',
      ),
    condition: FormulaSchema.optional()
      .nullable()
      .describe(generalDescriptions.condition('element node')),
    repeat: FormulaSchema.optional()
      .nullable()
      .describe(generalDescriptions.repeat('element node')),
    repeatKey: FormulaSchema.optional()
      .nullable()
      .describe(generalDescriptions.repeatKey('element node')),
    slot: z
      .string()
      .optional()
      .nullable()
      .describe(generalDescriptions.slot('element node')),
    variants: z
      .array(StyleVariantSchema)
      .optional()
      .nullable()
      .describe(generalDescriptions.variants('element node')),
    animations: z
      .record(
        z.string().describe(generalDescriptions.animationKey),
        z.record(
          z.string().describe(generalDescriptions.animationKeyframeKey),
          AnimationKeyframeSchema,
        ),
      )
      .optional()
      .nullable()
      .describe(generalDescriptions.animations('element node')),
  })
  .describe(
    'Schema defining an Element Node Model. An element is a standard HTML element.',
  )

const ComponentNodeModelSchema: z.ZodType<ComponentNodeModel> = z
  .object({
    type: z.literal('component'),
    name: z.string().describe('Name of the component to render.'),
    package: z
      .string()
      .optional()
      .nullable()
      .describe(
        'Name of the package this component comes from. If empty, it is a component defined in the current project.',
      ),
    attrs: z
      .record(
        z.string().describe('The name of the attribute'),
        FormulaSchema.describe(
          'Formula evaluating to the value of the attribute',
        ),
      )
      .describe('Attributes/props passed to the component.'),
    children: z.array(z.string()).describe(generalDescriptions.children),
    events: z
      .record(z.string(), EventModelSchema)
      .describe(
        'Record of events passed to the component. Only custom events defined by the component can be passed here.',
      ),
    style: NodeStyleModelSchema.optional()
      .nullable()
      .describe(generalDescriptions.style('component node')),
    condition: FormulaSchema.optional()
      .nullable()
      .describe(generalDescriptions.condition('component node')),
    repeat: FormulaSchema.optional()
      .nullable()
      .describe(generalDescriptions.repeat('component node')),
    repeatKey: FormulaSchema.optional()
      .nullable()
      .describe(generalDescriptions.repeatKey('component node')),
    slot: z
      .string()
      .optional()
      .nullable()
      .describe(generalDescriptions.slot('component node')),
    variants: z
      .array(StyleVariantSchema)
      .optional()
      .nullable()
      .describe(generalDescriptions.variants('component node')),
    animations: z
      .record(
        z.string().describe(generalDescriptions.animationKey),
        z.record(
          z.string().describe(generalDescriptions.animationKeyframeKey),
          AnimationKeyframeSchema,
        ),
      )
      .optional()
      .nullable()
      .describe(generalDescriptions.animations('component node')),
  })
  .describe('Schema defining a Component Node Model.')

const NodeModelSchema: z.ZodType<NodeModel> = z.lazy(() =>
  z.union([
    TextNodeModelSchema,
    SlotNodeModelSchema,
    ElementNodeModelSchema,
    ComponentNodeModelSchema,
  ]),
)

// API Models
const ApiMethodSchema: z.ZodType<any> = z
  .enum(['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'HEAD', 'OPTIONS'])
  .describe('HTTP method for the API request.')

const ApiParserModeSchema: z.ZodType<ApiParserMode> = z
  .enum(['auto', 'text', 'json', 'event-stream', 'json-stream', 'blob'])
  .describe('Available modes for parsing API responses.')

const RedirectStatusCodes = {
  '300': 300,
  '301': 301,
  '302': 302,
  '303': 303,
  '304': 304,
  '307': 307,
  '308': 308,
}
const RedirectStatusCodeSchema: z.ZodType<any> = z
  .enum(RedirectStatusCodes)
  .describe('HTTP status code to use for the redirect.')

const ApiRequestSchema: z.ZodType<ApiRequest> = z
  .object({
    '@nordcraft/metadata': MetadataSchema.optional()
      .nullable()
      .describe('Metadata for the API request'),
    version: z
      .literal(2)
      .describe('Version of the API request schema. This should always be 2.'),
    name: z.string().describe('Name of the API request.'),
    type: z.enum(['http', 'ws']).describe('Type of the API request.'),
    method: ApiMethodSchema.optional()
      .nullable()
      .describe('HTTP method for the API request.'),
    url: FormulaSchema.optional()
      .nullable()
      .describe(
        'Base URL for the API request. Params and query strings are added when this API is called.',
      ),
    service: z
      .string()
      .nullable()
      .optional()
      .nullable()
      .describe(
        'Name of the service to use for the API request. Only Services defined in the project can be used here.',
      ),
    servicePath: z
      .string()
      .nullable()
      .optional()
      .nullable()
      .describe(
        'File path to the service definition. If service is defined, servicePath must also be defined.',
      ),
    inputs: z
      .record(
        z.string().describe('Name of the input'),
        z
          .object({
            formula: FormulaSchema.nullable(),
          })
          .describe('Formula evaluating to the input value.'),
      )
      .describe(
        'Inputs to the API request. Inputs have a default value that can be overridden when the API is started from a workflow. Inputs can be used inside any Formula in the API request definition.',
      ),
    path: z
      .record(
        z.string().describe('Name of the path segment'),
        z.object({
          formula: FormulaSchema.describe(
            'Formula evaluating to the value of the path segment',
          ),
          index: z
            .number()
            .describe('Index defining the order of the path segments.'),
        }),
      )
      .optional()
      .nullable()
      .describe('Path segments to include in the API request.'),
    queryParams: z
      .record(
        z.string().describe('Name of the query parameter'),
        z.object({
          formula: FormulaSchema.describe(
            'Formula evaluating to the value of the query parameter',
          ),
          enabled: FormulaSchema.nullable()
            .optional()
            .nullable()
            .describe(
              'Formula evaluating to whether the query parameter is included or not. If included it should evaluate to true.',
            ),
        }),
      )
      .optional()
      .nullable()
      .describe('Query parameters to include in the API request.'),
    headers: z
      .record(
        z.string().describe('Name of the header'),
        z.object({
          formula: FormulaSchema.describe(
            'Formula evaluating to the header value',
          ),
          enabled: FormulaSchema.nullable()
            .optional()
            .nullable()
            .describe(
              'Formula evaluating to whether the header is included or not. If included it should evaluate to true.',
            ),
        }),
      )
      .optional()
      .nullable()
      .describe('Headers to include in the API request.'),
    body: FormulaSchema.optional()
      .nullable()
      .describe('Body of the API request.'),
    autoFetch: FormulaSchema.nullable()
      .optional()
      .nullable()
      .describe(
        'Indicates if the API request should be automatically fetched when the component or page loads.',
      ),
    client: z
      .object({
        parserMode: ApiParserModeSchema.describe(
          'Defines how the API response should be parsed.',
        ),
        credentials: z
          .enum(['include', 'same-origin', 'omit'])
          .optional()
          .nullable()
          .describe(
            'Indicates whether credentials such as cookies or authorization headers should be sent with the request.',
          ),
        debounce: z
          .object({ formula: FormulaSchema })
          .nullable()
          .optional()
          .nullable()
          .describe(
            'Debounce time in milliseconds for the API request. Useful for limiting the number of requests made when inputs change rapidly.',
          ),
        onCompleted: EventModelSchema.nullable()
          .optional()
          .nullable()
          .describe(
            'Event triggered when the API request completes successfully.',
          ),
        onFailed: EventModelSchema.nullable()
          .optional()
          .nullable()
          .describe(
            'Event triggered when the API request fails. This is also triggered when the isError formula evaluates to true.',
          ),
        onMessage: EventModelSchema.nullable()
          .optional()
          .nullable()
          .describe(
            'Event triggered when a message is received from the API. Only applicable for WebSocket and streaming APIs.',
          ),
      })
      .optional()
      .nullable()
      .describe('Client-side settings for the API request.'),
    server: z
      .object({
        proxy: z
          .object({
            enabled: z
              .object({ formula: FormulaSchema })
              .describe(
                'Indicates if the API request should be proxied through the Nordcraft backend server. This is useful for avoiding CORS issues or hiding sensitive information in the request. It is also useful if the request needs access to http-only cookies.',
              ),
            useTemplatesInBody: z
              .object({ formula: FormulaSchema })
              .nullable()
              .optional()
              .nullable()
              .describe(
                'Indicates if templates in the body should be processed when proxying the request. A template could be a http-only cookie that needs to be included in the proxied request. Enabling this flag will ensure that templates in the body are processed before sending the proxied request.',
              ),
          })
          .nullable()
          .optional()
          .nullable()
          .describe('Proxy settings for the API request.'),
        ssr: z
          .object({
            enabled: z
              .object({ formula: FormulaSchema })
              .nullable()
              .optional()
              .nullable()
              .describe(
                'Indicates if server-side rendering is enabled for this API request. This means the API will be executed on the server during the initial page load. Note: This can have performance implications for the loading of a page on slow APIs.',
              ),
          })
          .optional()
          .nullable()
          .describe('Server-side rendering settings.'),
      })
      .optional()
      .nullable()
      .describe('Server-side settings for the API request.'),
    timeout: z
      .object({ formula: FormulaSchema })
      .nullable()
      .optional()
      .nullable()
      .describe('Timeout for the API request in milliseconds.'),
    hash: z.object({ formula: FormulaSchema }).nullable().optional().nullable(),
    isError: z
      .object({ formula: FormulaSchema })
      .nullable()
      .optional()
      .nullable()
      .describe(
        'Indicates if the last API response was an error. Useful for forcing a response to be treated as an error even if status code is 200.',
      ),
    redirectRules: z
      .record(
        z.string().describe('The key of the redirect rule.'),
        z
          .object({
            formula: FormulaSchema.describe(
              'Formula evaluating to the URL. If a URL is returned, the redirect will be triggered. If null is returned, no redirect will happen.',
            ),
            index: z
              .number()
              .describe('Index defining the order of the redirect rules.'),
            statusCode: RedirectStatusCodeSchema.nullable()
              .optional()
              .nullable()
              .describe('HTTP status code to use for the redirect.'),
          })
          .describe('Defines a single redirect rule.'),
      )
      .nullable()
      .optional()
      .nullable()
      .describe(
        'Rules for redirecting based on response data. The key is a unique identifier for the rule.',
      ),
  })
  .describe('Schema defining an API request from a component or a page.')

const LegacyComponentAPISchema: z.ZodType<LegacyComponentAPI> = z
  .object({
    type: z.literal('REST'),
    name: z.string(),
    method: z.enum(['GET', 'POST', 'DELETE', 'PUT']),
    url: FormulaSchema.optional().nullable(),
    path: z
      .array(z.object({ formula: FormulaSchema }))
      .optional()
      .nullable(),
    queryParams: z
      .record(
        z.string(),
        z.object({
          name: z.string(),
          formula: FormulaSchema,
        }),
      )
      .optional()
      .nullable(),
    headers: z
      .union([z.record(z.string(), FormulaSchema), FormulaSchema])
      .optional()
      .nullable(),
    body: FormulaSchema.optional().nullable(),
    autoFetch: FormulaSchema.nullable().optional().nullable(),
    proxy: z.boolean().optional().nullable(),
    debounce: z.number().nullable().optional().nullable(),
    throttle: z.number().nullable().optional().nullable(),
    onCompleted: EventModelSchema.nullable(),
    onFailed: EventModelSchema.nullable(),
    auth: z
      .object({
        type: z.enum(['Bearer id_token', 'Bearer access_token']),
      })
      .optional()
      .nullable(),
  })
  .describe(
    'Legacy API schema for backward compatibility. Never use this for new APIs.',
  )

const ComponentAPISchema: z.ZodType<ComponentAPI> = z.union([
  LegacyComponentAPISchema,
  ApiRequestSchema,
])

const ComponentFormulaSchema: z.ZodType<ComponentFormula> = z.object({
  '@nordcraft/metadata': MetadataSchema.optional()
    .nullable()
    .describe(generalDescriptions.metadata('formula')),
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
    .nullable()
    .optional()
    .nullable()
    .describe('List of arguments accepted by the formula.'),
  memoize: z
    .boolean()
    .optional()
    .nullable()
    .describe('Indicates if the formula result should be memoized.'),
  exposeInContext: z
    .boolean()
    .optional()
    .nullable()
    .describe(
      'Indicates if the formula should be exposed in the component context for child components to subscribe to.',
    ),
})

const ComponentVariableSchema: z.ZodType<ComponentVariable> = z.object({
  '@nordcraft/metadata': MetadataSchema.optional()
    .nullable()
    .describe(generalDescriptions.metadata('variable')),
  initialValue: FormulaSchema.describe('Initial value of the variable'),
})

const ComponentWorkflowSchema: z.ZodType<ComponentWorkflow> = z
  .object({
    '@nordcraft/metadata': MetadataSchema.optional()
      .nullable()
      .describe(generalDescriptions.metadata('workflow')),
    name: z.string().describe('Name of the workflow'),
    parameters: z
      .array(
        z.object({
          name: z.string().describe('Name of the workflow parameter'),
          testValue: z.any().describe('Test value for the workflow parameter'),
        }),
      )
      .describe('Parameters accepted by the workflow'),
    actions: z
      .array(ActionModelSchema)
      .describe('List of actions that make up the workflow'),
    exposeInContext: z
      .boolean()
      .optional()
      .nullable()
      .describe(
        'Indicates if the workflow should be exposed in the context for child components to subscribe to.',
      ),
  })
  .describe('Schema defining a workflow.')

// Route Models
const StaticPathSegmentSchema: z.ZodType<StaticPathSegment> = z
  .object({
    type: z.literal('static').describe('Static path segment'),
    name: z.string().describe('Name of the static path segment'),
    optional: z
      .boolean()
      .optional()
      .nullable()
      .describe('Indicates if the segment is optional'),
  })
  .describe('Schema for static path segments')

const DynamicPathSegmentSchema: z.ZodType<DynamicPathSegment> = z
  .object({
    type: z
      .literal('param')
      .describe('Dynamic path segment representing a URL parameter'),
    name: z.string().describe('Name of the URL parameter'),
    testValue: z
      .string()
      .describe(generalDescriptions.testData('dynamic URL parameter')),
    optional: z
      .boolean()
      .optional()
      .nullable()
      .describe('Indicates if the URL parameter is optional'),
  })
  .describe('Schema for dynamic path segments (URL parameters)')

const HeadTagTypesSchema: z.ZodType<any> = z
  .enum(['meta', 'link', 'script', 'noscript', 'style'])
  .describe('Available head tags.')

const MetaEntrySchema: z.ZodType<MetaEntry> = z
  .object({
    tag: HeadTagTypesSchema.describe(
      'Type of the head tag such as meta, link, script.',
    ),
    attrs: z
      .record(
        z.string().describe('The name of the head tag attribute'),
        FormulaSchema.describe(
          'The Formula evaluating to the value of the head tag attribute',
        ),
      )
      .describe('Attributes for the head tag.'),
    content: FormulaSchema.describe(
      'Optional content for the head tag, used for tags like style or script.',
    ),
  })
  .describe('Schema defining a single meta entry for the head of the document.')

const RouteSchema: z.ZodType<RouteDeclaration> = z
  .object({
    path: z
      .array(z.union([StaticPathSegmentSchema, DynamicPathSegmentSchema]))
      .describe(
        'Array of path segments defining the route path. Each segment can be static or dynamic (parameterized). Each segment must be unique.',
      ),
    query: z.record(
      z.string().describe('Name of the query parameter. This must be unique.'),
      z
        .object({
          name: z
            .string()
            .describe('Name of the query parameter. Same as the key'),
          testValue: z
            .any()
            .describe(
              'Test value for the query parameter. Test data is only used while building the component in the Nordcraft editor.',
            ),
        })
        .describe(
          'Schema defining a query parameter. Nordcraft supports having query parameters with multiple values. Defining a query parameter as an array will allow multiple values for that parameter.',
        ),
    ),
    info: z
      .object({
        title: z
          .object({ formula: FormulaSchema })
          .optional()
          .nullable()
          .describe(
            'Title of the page, used in the document title and SEO metadata.',
          ),
        description: z
          .object({ formula: FormulaSchema })
          .optional()
          .nullable()
          .describe(
            'Description of the page, used in SEO metadata and social sharing previews.',
          ),
        icon: z
          .object({ formula: FormulaSchema })
          .optional()
          .nullable()
          .describe(
            'URL to the icon of the page, used in SEO metadata and social sharing previews.',
          ),
        language: z
          .object({ formula: FormulaSchema })
          .optional()
          .nullable()
          .describe(
            'Language of the page, used in the lang attribute of the HTML document.',
          ),
        charset: z
          .object({ formula: FormulaSchema })
          .optional()
          .nullable()
          .describe(
            'Character set of the page, used in the meta charset tag of the HTML document.',
          ),
        meta: z
          .record(
            z.string().describe('The key of the meta data record.'),
            MetaEntrySchema,
          )
          .optional()
          .nullable()
          .describe(
            'Additional meta tags to include in the head of the document. Each entry defines a tag and its attributes.',
          ),
      })
      .optional()
      .nullable()
      .describe(
        'Contains additional information for the route such as SEO metadata.',
      ),
  })
  .describe(
    'Schema defining the route information for a page as well as SEO related metadata.',
  )

const ComponentAttributeSchema: z.ZodType<ComponentAttribute> = z
  .object({
    '@nordcraft/metadata': MetadataSchema.optional()
      .nullable()
      .describe(generalDescriptions.metadata('component attribute')),
    name: z.string().describe('Name of the component attribute'),
    testValue: z
      .any()
      .describe(generalDescriptions.testData('component attribute')),
  })
  .describe('Schema for a component attribute.')

const ComponentEventSchema: z.ZodType<ComponentEvent> = z
  .object({
    '@nordcraft/metadata': MetadataSchema.optional()
      .nullable()
      .describe(generalDescriptions.metadata('component event')),
    name: z.string().describe('Name of the component event'),
    dummyEvent: z
      .any()
      .describe(generalDescriptions.testData('component event')),
  })
  .describe('Schema for a component event.')

const ComponentContextSchema: z.ZodType<ComponentContext> = z
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

const commonComponentSchema = (type: 'component' | 'page') =>
  z
    .object({
      name: z.string().describe(`Name of the ${type}`),
      exported: z
        .boolean()
        .optional()
        .nullable()
        .describe(
          `Whether the ${type} is exported in a package project for use in other projects. Do not change this value. It should be managed by the user.`,
        ),
      nodes: z
        .record(z.string(), NodeModelSchema)
        .optional()
        .nullable()
        .describe(
          `All nodes in the ${type}, indexed by their unique IDs. Nodes represent HTML elements, text, slots, or ${type === 'component' ? 'other components' : 'components'}. They defined the UI structure of the ${type}.`,
        ),
      variables: z
        .record(z.string(), ComponentVariableSchema)
        .optional()
        .nullable()
        .describe(generalDescriptions.variables(type)),
      formulas: z
        .record(z.string(), ComponentFormulaSchema)
        .optional()
        .nullable()
        .describe(generalDescriptions.formulas(type)),
      workflows: z
        .record(z.string(), ComponentWorkflowSchema)
        .optional()
        .nullable()
        .describe(generalDescriptions.workflows(type)),
      apis: z
        .record(z.string(), ComponentAPISchema)
        .optional()
        .nullable()
        .describe(generalDescriptions.apis(type)),
      events: z
        .array(ComponentEventSchema)
        .optional()
        .nullable()
        .describe(
          'All events this the component can emit. Events allow the component to communicate with its parent or other components. They can be triggered via actions.',
        ),
      contexts: z
        .record(z.string(), ComponentContextSchema)
        .optional()
        .nullable()
        .describe(
          'Defines which contexts this component is subscribed to. Contexts allow the component to access formulas and workflows from other components, enabling reusability and modular design.',
        ),
      onLoad: z
        .object({
          trigger: z.literal('Load'),
          actions: z.array(ActionModelSchema),
        })
        .optional()
        .nullable()
        .describe(generalDescriptions.onLoad(type)),
      onAttributeChange: z
        .object({
          trigger: z.literal('Attribute change'),
          actions: z.array(ActionModelSchema),
        })
        .optional()
        .nullable()
        .describe(generalDescriptions.onAttributeChange(type)),
    })
    .describe('Schema defining a reusable Nordcraft component.')

export const ComponentSchema: z.ZodType<Component> = commonComponentSchema(
  'component',
).extend({
  attributes: z
    .record(z.string(), ComponentAttributeSchema)
    .describe(
      'All attributes that can be passed into the component when it is used. Attributes allow for customization and configuration of the component instance. When the value of an attribute changes, any formulas depending on it will automatically recalculate and the onAttributeChange lifecycle event is triggered.',
    ),
})

export const PageSchema: z.ZodType<PageComponent> = commonComponentSchema(
  'page',
).extend({
  attributes: z
    .object({})
    .describe(
      'Attributes for the page (currently none). Should always be an empty object.',
    ),
  route: RouteSchema.describe(
    'Route information for the page, including path segments, query parameters, and metadata such as title and description.',
  ),
})
