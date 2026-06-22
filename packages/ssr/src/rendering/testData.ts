import { isLegacyApi } from '@nordcraft/core/dist/api/api'
import type { ComponentAPI } from '@nordcraft/core/dist/api/apiTypes'
import type {
  ActionModel,
  Component,
  ComponentAttribute,
  ComponentFormula,
  ComponentWorkflow,
  CustomActionArgument,
  CustomActionModel,
  EventActionModel,
  NodeModel,
  SetURLParameterAction,
  SwitchActionModel,
  TextNodeModel,
  VariableActionModel,
  WorkflowActionModel,
  WorkflowCallbackActionModel,
} from '@nordcraft/core/dist/component/component.types'
import {
  isFormula,
  type ApplyOperation,
  type Formula,
} from '@nordcraft/core/dist/formula/formula'
import type { Nullable } from '@nordcraft/core/dist/types'
import {
  filterObject,
  mapObject,
  omitKeys,
} from '@nordcraft/core/dist/utils/collections'
import { isDefined } from '@nordcraft/core/dist/utils/util'

export const removeTestData = (component: Component): Component =>
  removeOptionalPropertiesIfEmpty<Component>(
    {
      ...component,
      attributes: mapObject(
        filterObject<Nullable<ComponentAttribute>, ComponentAttribute>(
          component.attributes ?? {},
          ([_, value]) => isDefined(value),
        ),
        ([key, value]) => [key, omitKeys(value, ['testValue'])],
      ),
      ...(component.events
        ? {
            events: component.events
              .filter(isDefined)
              .map((event) => omitKeys(event, ['dummyEvent'])),
          }
        : undefined),
      nodes: processNodes(component.nodes),
      ...(component.route
        ? {
            route: {
              ...component.route,
              path: component.route.path.map((p) => omitKeys(p, ['testValue'])),
              query: mapObject(component.route.query, ([key, value]) => [
                key,
                omitKeys(value, ['testValue']),
              ]),
            },
          }
        : {}),
      ...(component.formulas
        ? {
            formulas: mapObject(
              filterObject<Nullable<ComponentFormula>, ComponentFormula>(
                component.formulas,
                ([_, value]) => isDefined(value),
              ),
              ([key, value]) => [
                key,
                {
                  ...value,
                  arguments: (value.arguments ?? []).map((a) =>
                    omitKeys(a, ['testValue']),
                  ),
                  formula: removeFormulaTestData(value.formula),
                },
              ],
            ),
          }
        : {}),
      ...(component.workflows
        ? {
            workflows: mapObject(
              filterObject<Nullable<ComponentWorkflow>, ComponentWorkflow>(
                component.workflows,
                ([_, value]) => isDefined(value),
              ),
              ([key, value]) => [
                key,
                {
                  ...omitKeys(value, ['testValue']),
                  // We should find all actions (also nested actions and non-workflow actions) and remove
                  // the description from them. This is a start though
                  actions: value.actions.map(removeActionTestData),
                  parameters: (value.parameters ?? []).map((p) =>
                    omitKeys(p, ['testValue']),
                  ),
                  callbacks: value.callbacks?.map((c) =>
                    omitKeys(c, ['testValue']),
                  ),
                },
              ],
            ),
          }
        : {}),
      apis: mapObject(
        filterObject<Nullable<ComponentAPI>, ComponentAPI>(
          component.apis ?? {},
          ([_, api]) => isDefined(api),
        ),
        ([key, api]) => [
          key,
          // service and servicePath are only necessary in the editor. All information about an API
          // request is available on the api object itself
          isLegacyApi(api) ? api : omitKeys(api, ['service', 'servicePath']),
        ],
      ),
      ...(component.onLoad
        ? {
            onLoad: {
              ...component.onLoad,
              actions: component.onLoad.actions?.map(removeActionTestData),
            },
          }
        : undefined),
      ...(component.onAttributeChange
        ? {
            onAttributeChange: {
              ...component.onAttributeChange,
              actions:
                component.onAttributeChange.actions?.map(removeActionTestData),
            },
          }
        : undefined),
    },
    [
      'version',
      'page',
      'route',
      'attributes',
      'variables',
      'formulas',
      'contexts',
      'workflows',
      'apis',
      'nodes',
      'events',
      'onLoad',
      'onAttributeChange',
      'exported',
      'customElement',
    ],
  )

const processNodes = (
  nodes: Component['nodes'],
): Record<string, NodeModel> | undefined => {
  if (!isDefined(nodes)) {
    return undefined
  }
  return mapObject(
    filterObject<NodeModel | undefined, NodeModel>(nodes, ([_, value]) =>
      isDefined(value),
    ),
    ([key, value]) => {
      switch (value.type) {
        case 'element': {
          const updatedNode: NodeModel = {
            ...value,
            events: mapObject(value.events ?? {}, ([eventKey, eventValue]) => [
              eventKey,
              eventValue
                ? {
                    ...eventValue,
                    actions: eventValue.actions?.map(removeActionTestData),
                  }
                : null,
            ]),
            repeat: value.repeat
              ? removeFormulaTestData(value.repeat)
              : undefined,
            repeatKey: value.repeatKey
              ? removeFormulaTestData(value.repeatKey)
              : undefined,
          }
          return [
            key,
            removeOptionalPropertiesIfEmpty(updatedNode, [
              'animations',
              'attrs',
              'children',
              'condition',
              'classes',
              'customProperties',
              'events',
              'id',
              'repeat',
              'repeatKey',
              'slot',
              'style-variables',
              'styleVariables',
            ]) as NodeModel,
          ]
        }
        case 'text': {
          return [
            key,
            removeOptionalPropertiesIfEmpty<TextNodeModel>(
              {
                ...value,
                repeat: value.repeat
                  ? removeFormulaTestData(value.repeat)
                  : undefined,
                repeatKey: value.repeatKey
                  ? removeFormulaTestData(value.repeatKey)
                  : undefined,
              },
              ['id', 'slot', 'repeat', 'repeatKey'],
            ) as NodeModel,
          ]
        }
        case 'component': {
          const updatedNode: NodeModel = {
            ...value,
            events: mapObject(value.events ?? {}, ([eventKey, eventValue]) => [
              eventKey,
              eventValue
                ? {
                    ...eventValue,
                    actions: eventValue.actions?.map(removeActionTestData),
                  }
                : null,
            ]),
            repeat: value.repeat
              ? removeFormulaTestData(value.repeat)
              : undefined,
            repeatKey: value.repeatKey
              ? removeFormulaTestData(value.repeatKey)
              : undefined,
          }
          return [
            key,
            removeOptionalPropertiesIfEmpty(updatedNode, [
              'id',
              'slot',
              'path',
              'package',
              'condition',
              'repeat',
              'repeatKey',
              'variants',
              'animations',
              'attrs',
              'children',
              'events',
            ]) as NodeModel,
          ]
        }
        case 'slot': {
          return [
            key,
            removeOptionalPropertiesIfEmpty(
              omitKeys(
                value,
                // Always remove repeat and repeatKey from slots as they're not supported
                ['repeat', 'repeatKey'],
              ),
              ['children', 'condition', 'events', 'name', 'slot'],
            ) as NodeModel,
          ]
        }
      }
    },
  )
}

type OptionalKeys<T extends object> = {
  [K in keyof T]-?: object extends Pick<T, K> ? K : never
}[keyof T]

const removeOptionalPropertiesIfEmpty = <T extends object>(
  obj: T,
  keysToRemove: OptionalKeys<T>[],
): T => {
  const newObj = { ...obj }
  for (const key of keysToRemove) {
    const value = obj[key]
    if (
      value === null ||
      value === undefined ||
      (Array.isArray(value) && value.length === 0) || // Covers empty arrays
      (typeof value === 'object' && Object.keys(value).length === 0) // Covers empty objects
    ) {
      delete newObj[key]
    }
  }
  return newObj
}

const removeActionTestData = (action: ActionModel): ActionModel => {
  if (!isDefined(action)) {
    return action
  }
  switch (action.type) {
    case 'SetVariable':
      return removeOptionalPropertiesIfEmpty<VariableActionModel>(
        {
          ...action,
          ...(action.data
            ? { data: removeFormulaTestData(action.data) }
            : undefined),
        },
        ['arguments'],
      )
    case 'TriggerEvent':
    case 'SetURLParameter':
    case 'TriggerWorkflowCallback':
      return removeOptionalPropertiesIfEmpty<
        EventActionModel | SetURLParameterAction | WorkflowCallbackActionModel
      >(
        {
          ...action,
          ...(action.data
            ? { data: removeFormulaTestData(action.data) }
            : undefined),
        },
        ['arguments'],
      )
    case 'Switch':
      return removeOptionalPropertiesIfEmpty<SwitchActionModel>(
        {
          ...action,
          cases: (action.cases ?? []).map((c) => ({
            ...c,
            ...(c.condition
              ? { condition: removeFormulaTestData(c.condition) }
              : undefined),
            actions: c.actions.map(removeActionTestData),
          })),
          default: {
            ...action.default,
            actions: (action.default?.actions ?? []).map(removeActionTestData),
          },
        },
        ['arguments'],
      )
    case 'Fetch':
      return {
        ...action,
        inputs: action.inputs
          ? mapObject(action.inputs, ([key, value]) => [
              key,
              {
                ...value,
                ...(value.formula
                  ? { formula: removeFormulaTestData(value.formula) }
                  : undefined),
              },
            ])
          : action.inputs,
        onSuccess: {
          ...action.onSuccess,
          actions: (action.onSuccess?.actions ?? []).map(removeActionTestData),
        },
        onError: {
          ...action.onError,
          actions: (action.onError?.actions ?? []).map(removeActionTestData),
        },
        onMessage: action.onMessage
          ? {
              ...action.onMessage,
              actions: (action.onMessage?.actions ?? []).map(
                removeActionTestData,
              ),
            }
          : undefined,
      }
    case 'Custom':
    case undefined:
    case null:
      return removeOptionalPropertiesIfEmpty<CustomActionModel>(
        {
          // The 'group' property was used for categorizing actions and should
          // not have been persisted in projects. But since it's there (for some actions)
          // we should remove it
          ...omitKeys(action, ['description', 'group', 'label']),
          ...(action.arguments
            ? {
                arguments: action.arguments.map((a) =>
                  a ? removeActionArgumentTestData(a) : a,
                ),
              }
            : undefined),
          ...(action.events
            ? {
                events: mapObject(
                  action.events ?? {},
                  ([eventKey, eventValue]) => [
                    eventKey,
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    eventValue
                      ? {
                          ...eventValue,
                          actions: (eventValue.actions ?? []).map(
                            removeActionTestData,
                          ),
                        }
                      : eventValue,
                  ],
                ),
              }
            : undefined),
        },
        ['arguments', 'events', 'package'],
      )
    case 'SetURLParameters':
      return {
        ...action,
        parameters: mapObject(action.parameters, ([key, value]) => [
          key,
          removeFormulaTestData(value),
        ]),
      }
    case 'TriggerWorkflow':
      return removeOptionalPropertiesIfEmpty<WorkflowActionModel>(
        {
          ...action,
          // TODO: Below was breaking the build - investigate. Test by adding an animation etc. and see if it is being set to null by mistake
          // ...(action.parameters
          //   ? {
          //       parameters: mapObject(action.parameters, ([key, value]) => [
          //         key,
          //         {
          //           ...value,
          //           formula: isFormula(value)
          //             ? removeFormulaTestData(value)
          //             : isFormula(value.formula)
          //               ? removeFormulaTestData(value.formula)
          //               : value.formula,
          //         },
          //       ]),
          //     }
          //   : undefined),
          ...(action.callbacks
            ? {
                callbacks: mapObject(action.callbacks, ([key, value]) => [
                  key,
                  {
                    ...value,
                    actions:
                      value?.actions?.map((a) =>
                        a ? removeActionTestData(a) : a,
                      ) ?? [],
                  },
                ]),
              }
            : undefined),
        },
        ['callbacks', 'contextProvider', 'parameters'],
      )
    case 'AbortFetch':
      // Fetch aborts have no test data
      return action
  }
}

const removeActionArgumentTestData = (action: CustomActionArgument) => {
  if (!isDefined(action)) {
    return action
  }
  return {
    ...omitKeys(action, ['description', 'type']),
    formula: action.formula
      ? removeFormulaTestData(action.formula)
      : action.formula,
  }
}

const removeFormulaTestData = (_formula: Formula): Formula => {
  if (!isFormula(_formula)) {
    return _formula
  }
  const formula = removeOptionalPropertiesIfEmpty<Formula>(_formula, [
    'label',
    '@nordcraft/metadata',
  ])
  switch (formula.type) {
    case 'path':
      return formula
    case 'value':
      return formula
    case 'function':
      return removeOptionalPropertiesIfEmpty(formula, [
        'arguments',
        'display_name',
        'variableArguments',
      ])
    case 'record':
      return {
        ...formula,
        entries: (formula.entries ?? []).map((entry) => ({
          ...entry,
          formula: removeFormulaTestData(entry.formula),
        })),
      }
    case 'array':
    case 'or':
    case 'and':
    case 'object':
      return {
        ...formula,
        arguments:
          formula.arguments?.map((arg) => ({
            ...arg,
            formula: removeFormulaTestData(arg.formula),
          })) ?? [],
      }
    case 'apply':
      return removeOptionalPropertiesIfEmpty<ApplyOperation>(
        {
          ...formula,
          arguments: (formula.arguments ?? []).map((a) => ({
            ...omitKeys(a, ['testValue']),
            formula: removeFormulaTestData(a.formula),
          })),
        },
        ['arguments'],
      )
    case 'switch':
      return {
        ...formula,
        cases: (formula.cases ?? []).map((c) => ({
          ...c,
          condition: removeFormulaTestData(c.condition),
        })),
        default: removeFormulaTestData(formula.default),
      }
  }
}
