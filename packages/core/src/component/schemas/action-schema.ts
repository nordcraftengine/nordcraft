import * as v from 'valibot'
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
import { record } from './valibot-schemas'

// Action Models
const VariableActionModelSchema: v.GenericSchema<unknown, VariableActionModel> =
  v.pipe(
    v.object({
      type: v.literal('SetVariable'),
      variable: v.pipe(
        v.string(),
        v.description('Name of the variable to be set.'),
      ),
      data: v.pipe(
        FormulaSchema,
        v.description('Formula evaluating to the new variable value.'),
      ),
    }),
    v.description('Model describing the action of setting a variable.'),
  )

const EventActionModelSchema: v.GenericSchema<unknown, EventActionModel> =
  v.pipe(
    v.object({
      type: v.literal('TriggerEvent'),
      event: v.pipe(
        v.string(),
        v.description('Name of the event to be triggered.'),
      ),
      data: v.pipe(
        FormulaSchema,
        v.description('Data to pass to the event being triggered.'),
      ),
    }),
    v.description(
      'Model describing the action of triggering an event. This is only relevant on components as they are the only entities that can have events defined.',
    ),
  )

const SwitchActionModelSchema: v.GenericSchema<unknown, SwitchActionModel> =
  v.pipe(
    v.object({
      type: v.literal('Switch'),
      cases: v.pipe(
        v.nullish(
          v.array(
            v.object({
              condition: v.pipe(
                FormulaSchema,
                v.description(
                  'Condition to evaluate for this case. If truthy the actions are executed.',
                ),
              ),
              actions: v.pipe(
                v.array(v.lazy(() => ActionModelSchema)),
                v.description(
                  'List of actions to execute if the condition is met.',
                ),
              ),
            }),
          ),
        ),
        v.description(
          'Cases for the switch action. Each case has a condition and actions.',
        ),
      ),
      default: v.pipe(
        v.nullish(
          v.object({
            actions: v.array(v.lazy(() => ActionModelSchema)),
          }),
        ),
        v.description('Actions to execute if no case conditions are met.'),
      ),
    }),
    v.description(
      'Model describing a switch action. A switch action allows branching logic based on conditions.',
    ),
  )

const FetchActionModelSchema: v.GenericSchema<unknown, FetchActionModel> =
  v.pipe(
    v.object({
      type: v.literal('Fetch'),
      api: v.pipe(
        v.string(),
        v.description(
          'Key of the API to fetch data from. This is the key defined in the APIs object in the file.',
        ),
      ),
      inputs: v.pipe(
        record(
          v.pipe(v.string(), v.description('Name of the API input.')),
          v.object({
            formula: v.pipe(
              v.nullish(FormulaSchema),
              v.description('Formula for the input.'),
            ),
          }),
        ),
        v.description(
          'Inputs overriding the default input values for the API. Available inputs are defined as part of the API definition.',
        ),
      ),
      onSuccess: v.pipe(
        v.nullish(
          v.object({
            actions: v.array(v.lazy(() => ActionModelSchema)),
          }),
        ),
        v.description('Actions to execute when the fetch is successful.'),
      ),
      onError: v.pipe(
        v.nullish(
          v.object({
            actions: v.array(v.lazy(() => ActionModelSchema)),
          }),
        ),
        v.description('Actions to execute when the fetch fails.'),
      ),
      onMessage: v.pipe(
        v.nullish(
          v.object({
            actions: v.array(v.lazy(() => ActionModelSchema)),
          }),
        ),
        v.description(
          'Actions to execute when a message is received during streaming.',
        ),
      ),
    }),
    v.description('Model describing the action of fetching data from an API.'),
  )

const CustomActionModelSchema: v.GenericSchema<unknown, CustomActionModel> =
  v.pipe(
    v.object({
      type: v.literal('Custom'),
      name: v.pipe(
        v.string(),
        v.description('Name of the custom action to be executed.'),
      ),
      package: v.pipe(
        v.nullish(v.string()),
        v.description(
          'Package where the custom action is defined. Should not be set for local custom actions.',
        ),
      ),
      arguments: v.pipe(
        v.nullish(
          v.array(
            v.object({
              name: v.pipe(v.string(), v.description('Name of the argument.')),
              formula: v.pipe(
                FormulaSchema,
                v.description('Formula evaluating to the argument value.'),
              ),
            }),
          ),
        ),
        v.description('Arguments to pass to the custom action.'),
      ),
      events: v.pipe(
        v.nullish(
          record(
            v.pipe(v.string(), v.description('Name of the event.')),
            v.pipe(
              v.object({
                actions: v.pipe(
                  v.array(v.lazy(() => ActionModelSchema)),
                  v.description(
                    'List of actions to execute when the event is triggered.',
                  ),
                ),
              }),
              v.description(
                'Record with one entry called "actions" which is a list of actions to execute when the event is triggered..',
              ),
            ),
          ),
        ),
        v.description(
          'Record of events defined in the custom action. Each event has a list of actions to execute when the event is emitted.',
        ),
      ),
      version: v.pipe(
        v.nullish(v.literal(2)),
        v.description(
          'Version of the custom action model. This should always be 2.',
        ),
      ),
    }),
    v.description(
      'Model describing the action of a custom action. A custom action is a user-defined action that can be reused across the project. A list of available custom actions has been provided as part of the system prompt.',
    ),
  )

const BuiltInActionModelSchema: v.GenericSchema<unknown, CustomActionModel> =
  v.pipe(
    v.object({
      name: v.pipe(
        v.string(),
        v.description(
          'Name of the built-in action. This will always be prefixed with "@toddle/" and should match the action key in the system.',
        ),
      ),
      arguments: v.pipe(
        v.nullish(
          v.array(
            v.object({
              name: v.pipe(v.string(), v.description('Name of the argument.')),
              formula: v.pipe(
                FormulaSchema,
                v.description('Formula evaluating to the argument value.'),
              ),
            }),
          ),
        ),
        v.description('Arguments to pass to the built-in action.'),
      ),
      events: v.pipe(
        v.nullish(
          record(
            v.pipe(v.string(), v.description('Name of the event.')),
            v.pipe(
              v.object({
                actions: v.array(v.lazy(() => ActionModelSchema)),
              }),
              v.description(
                'List of actions to execute when the event is triggered.',
              ),
            ),
          ),
        ),
        v.description(
          'Events that can be triggered by the built-in action. Common events include onSuccess and onError.',
        ),
      ),
      label: v.pipe(
        v.string(),
        v.description(
          'Label for the built-in action. This label will be used in the UI.',
        ),
      ),
    }),
    v.description(
      'Model describing a built-in action provided by the Nordcraft system. Built-in actions are pre-defined actions that can be used to perform common tasks within a Nordcraft project.',
    ),
  )

const SetURLParameterActionSchema: v.GenericSchema<
  unknown,
  SetURLParameterAction
> = v.pipe(
  v.object({
    type: v.literal('SetURLParameter'),
    parameter: v.string(),
    data: FormulaSchema,
    historyMode: v.nullish(v.picklist(['replace', 'push'])),
  }),
  v.description(
    'This model is deprecated. Instead refer to SetMultiUrlParameterActionSchema.',
  ),
)

const SetMultiUrlParameterActionSchema: v.GenericSchema<
  unknown,
  SetMultiUrlParameterAction
> = v.pipe(
  v.object({
    type: v.literal('SetURLParameters'),
    parameters: v.pipe(
      record(v.string(), FormulaSchema),
      v.description(
        'Record of URL parameters to set, where the key is the parameter name and the value is a formula evaluating to the parameter value.',
      ),
    ),
    historyMode: v.pipe(
      v.nullish(v.picklist(['replace', 'push'])),
      v.description(
        'This determines how the URL is updated in the browser history. Use "replace" to update the current history entry without adding a new one, or "push" to create a new history entry for the URL change. If not specified, the default behavior is to use "push".',
      ),
    ),
  }),
  v.description(
    'Model describing the action of setting multiple URL parameters. Use this action to update any number (1-*) of URL parameter(s) in one go.',
  ),
)

const WorkflowActionModelSchema: v.GenericSchema<unknown, WorkflowActionModel> =
  v.pipe(
    v.object({
      type: v.literal('TriggerWorkflow'),
      workflow: v.pipe(
        v.string(),
        v.description('ID of the workflow to be triggered.'),
      ),
      parameters: v.pipe(
        record(
          v.pipe(v.string(), v.description('Name of the workflow parameter.')),
          v.pipe(
            v.object({
              formula: FormulaSchema,
            }),
            v.description('Formula evaluating to the parameter value.'),
          ),
        ),
        v.description('Parameters to pass to the workflow being triggered. '),
      ),
      contextProvider: v.pipe(
        v.nullish(v.string()),
        v.description(
          'If the workflow being triggered is from a parent component and exposed via a context provider, this is the ID of that context provider.',
        ),
      ),
    }),
    v.description('Model describing the action of triggering a workflow.'),
  )

export const ActionModelSchema: v.GenericSchema<unknown, ActionModel> = v.lazy(
  () =>
    v.union([
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
