import { isLegacyApi } from '@nordcraft/core/dist/api/api'
import type {
  ActionModel,
  Component,
  CustomActionArgument,
  NodeModel,
} from '@nordcraft/core/dist/component/component.types'
import { isFormula, type Formula } from '@nordcraft/core/dist/formula/formula'
import { mapObject, omitKeys } from '@nordcraft/core/dist/utils/collections'

export const removeTestData = (component: Component): Component => ({
  ...component,
  attributes: mapObject(component.attributes, ([key, value]) => [
    key,
    omitKeys(value, ['testValue']),
  ]),
  events: component.events?.map((event) => omitKeys(event, ['dummyEvent'])),
  nodes: mapObject(component.nodes, ([key, value]) => {
    if (value.type === 'element') {
      const updatedNode: NodeModel = {
        ...value,
        events: mapObject(value.events, ([eventKey, eventValue]) => [
          eventKey,
          eventValue
            ? {
                ...eventValue,
                actions: eventValue.actions.map(removeActionTestData),
              }
            : null,
        ]),
      }
      return [key, updatedNode as NodeModel]
    }
    return [key, value]
  }),
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
        formulas: mapObject(component.formulas, ([key, value]) => [
          key,
          {
            ...value,
            arguments: (value.arguments ?? []).map((a) =>
              omitKeys(a, ['testValue']),
            ),
          },
        ]),
      }
    : {}),
  ...(component.workflows
    ? {
        workflows: mapObject(component.workflows, ([key, value]) => [
          key,
          {
            ...omitKeys(value, ['testValue']),
            // We should find all actions (also nested actions and non-workflow actions) and remove
            // the description from them. This is a start though
            actions: value.actions.map(removeActionTestData),
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            parameters: (value.parameters || []).map((p) =>
              omitKeys(p, ['testValue']),
            ),
            callbacks: value.callbacks?.map((c) => omitKeys(c, ['testValue'])),
          },
        ]),
      }
    : {}),
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  apis: mapObject(component.apis ?? {}, ([key, api]) => [
    key,
    // service and servicePath are only necessary in the editor. All information about an API
    // request is available on the api object itself
    isLegacyApi(api) ? api : omitKeys(api, ['service', 'servicePath']),
  ]),
  onLoad: component.onLoad
    ? {
        ...component.onLoad,
        actions: component.onLoad.actions.map(removeActionTestData),
      }
    : undefined,
  onAttributeChange: component.onAttributeChange
    ? {
        ...component.onAttributeChange,
        actions: component.onAttributeChange.actions.map(removeActionTestData),
      }
    : undefined,
})

const removeActionTestData = (action: ActionModel): ActionModel => {
  switch (action.type) {
    case 'SetVariable':
      return {
        ...action,
        data: action.data ? removeFormulaTestData(action.data) : action.data,
      }
    case 'TriggerEvent':
    case 'SetURLParameter':
    case 'TriggerWorkflowCallback':
      return {
        ...action,
        data: action.data ? removeFormulaTestData(action.data) : action.data,
      }
    case 'Switch':
      return {
        ...action,
        cases: action.cases.map((c) => ({
          ...c,
          condition: c.condition ? removeFormulaTestData(c.condition) : null,
          actions: c.actions.map(removeActionTestData),
        })),
        default: {
          ...action.default,
          actions: action.default.actions.map(removeActionTestData),
        },
      }
    case 'Fetch':
      return {
        ...action,
        inputs: action.inputs
          ? mapObject(action.inputs, ([key, value]) => [
              key,
              {
                ...value,
                formula: value.formula
                  ? removeFormulaTestData(value.formula)
                  : value.formula,
              },
            ])
          : action.inputs,
        onSuccess: {
          ...action,
          actions: action.onSuccess.actions.map(removeActionTestData),
        },
        onError: {
          ...action.onError,
          actions: action.onError.actions.map(removeActionTestData),
        },
        onMessage: action.onMessage
          ? {
              ...action.onMessage,
              actions: action.onMessage.actions.map(removeActionTestData),
            }
          : undefined,
      }
    case 'Custom':
    case undefined:
      return {
        // The 'group' property was used for categorizing actions and should
        // not have been persisted in projects. But since it's there (for some actions)
        // we should remove it
        ...omitKeys(action, ['description', 'group', 'label']),
        arguments: action.arguments
          ? action.arguments.map((a) =>
              a ? removeActionArgumentTestData(a) : a,
            )
          : action.arguments,
        events: action.events
          ? mapObject(action.events ?? {}, ([eventKey, eventValue]) => [
              eventKey,
              // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
              eventValue
                ? {
                    ...eventValue,
                    actions: eventValue.actions.map(removeActionTestData),
                  }
                : eventValue,
            ])
          : action.events,
      }
    case 'SetURLParameters':
      return {
        ...action,
        parameters: mapObject(action.parameters, ([key, value]) => [
          key,
          removeFormulaTestData(value),
        ]),
      }
    case 'TriggerWorkflow':
      return {
        ...action,
        parameters: action.parameters
          ? mapObject(action.parameters, ([key, value]) => [
              key,
              {
                ...value,
                formula: isFormula(value)
                  ? removeFormulaTestData(value)
                  : isFormula(value.formula)
                    ? removeFormulaTestData(value.formula)
                    : value.formula,
              },
            ])
          : action.parameters,
        callbacks: action.callbacks
          ? mapObject(action.callbacks, ([key, value]) => [
              key,
              { ...value, actions: value.actions.map(removeActionTestData) },
            ])
          : action.callbacks,
      }
  }
}

const removeActionArgumentTestData = (action: CustomActionArgument) => {
  return {
    ...omitKeys(action, ['description', 'type']),
    formula: action.formula
      ? removeFormulaTestData(action.formula)
      : action.formula,
  }
}

const removeFormulaTestData = (formula: Formula): Formula => {
  switch (formula.type) {
    case 'path':
    case 'value':
    case 'function':
      return formula
    case 'record':
      return {
        ...formula,
        entries: formula.entries.map((entry) => ({
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
      return {
        ...formula,
        arguments: formula.arguments.map((a) => ({
          ...omitKeys(a, ['testValue']),
          formula: removeFormulaTestData(a.formula),
        })),
      }
    case 'switch':
      return {
        ...formula,
        cases: formula.cases.map((c) => ({
          ...c,
          condition: removeFormulaTestData(c.condition),
        })),
        default: removeFormulaTestData(formula.default),
      }
  }
}
