import { isLegacyApi } from '@nordcraft/core/dist/api/api'
import type {
  ActionModel,
  Component,
  CustomActionArgument,
} from '@nordcraft/core/dist/component/component.types'
import { mapObject, omitKeys } from '@nordcraft/core/dist/utils/collections'

export function removeTestData(component: Component): Component {
  return {
    ...component,
    attributes: mapObject(component.attributes, ([key, value]) => [
      key,
      omitKeys(value, ['testValue']),
    ]),
    nodes: mapObject(component.nodes, ([key, value]) => {
      let events = {}
      if (value.type === 'element') {
        events = mapObject(value.events, ([eventKey, eventValue]) => [
          eventKey,
          {
            ...eventValue,
            actions: eventValue.actions.map(removeActionTestData),
          },
        ])
      }
      return [key, { ...value, events }]
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
              ...value,
              // We should find all actions (also nested actions and non-workflow actions) and remove
              // the description from them. This is a start though
              actions: value.actions.map(removeActionTestData),
              // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
              parameters: (value.parameters || []).map((p) =>
                omitKeys(p, ['testValue']),
              ),
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
          actions:
            component.onAttributeChange.actions.map(removeActionTestData),
        }
      : undefined,
  }
}

const removeActionTestData = (action: ActionModel) => {
  if (action.type === 'Custom') {
    return {
      ...omitKeys(action, ['description', 'group', 'label']),
      arguments: action.arguments?.map(removeActionArgumentTestData),
    }
  }
  return action
}

const removeActionArgumentTestData = (action: CustomActionArgument) =>
  omitKeys(action, ['description', 'type'])
