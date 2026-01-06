import { z } from 'zod'
import type {
  ActionModel,
  CustomActionModel,
  EventActionModel,
  FetchActionModel,
  SetMultiUrlParameterAction,
  SetURLParameterAction,
  SwitchActionModel,
  VariableActionModel,
  WorkflowActionModel,
} from '../component.types'
import { FormulaSchema } from './formula-schema'

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
          formula: FormulaSchema.nullish().describe('Formula for the input.'),
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
      .nullish()
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
      .nullish()
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
      .nullish()
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
      .nullish()
      .describe(
        'Record of events defined in the custom action. Each event has a list of actions to execute when the event is emitted.',
      ),
    version: z
      .literal(2)
      .nullish()
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
      .nullish()
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
      .nullish()
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
    historyMode: z.enum(['replace', 'push']).nullish(),
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
        .nullish()
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
      .nullish()
      .describe(
        'If the workflow being triggered is from a parent component and exposed via a context provider, this is the ID of that context provider.',
      ),
  })
  .describe('Model describing the action of triggering a workflow.')

export const ActionModelSchema: z.ZodType<ActionModel> = z.lazy(() =>
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
