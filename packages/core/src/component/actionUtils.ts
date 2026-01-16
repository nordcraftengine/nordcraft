import type { LegacyPluginAction, Nullable, PluginActionV2 } from '../types'
import { isDefined } from '../utils/util'
import type { ActionModel } from './component.types'

export function* getActionsInAction(
  action: Nullable<ActionModel>,
  path: (string | number)[] = [],
): Generator<[(string | number)[], ActionModel]> {
  if (!isDefined(action)) {
    return
  }

  yield [path, action]
  switch (action.type) {
    case 'AbortFetch':
    case 'SetURLParameter':
    case 'SetURLParameters':
    case 'SetVariable':
    case 'TriggerEvent':
    case 'TriggerWorkflow':
    case 'TriggerWorkflowCallback':
      break
    case 'Fetch':
      for (const [key, a] of Object.entries(action.onSuccess?.actions ?? {})) {
        yield* getActionsInAction(a, [...path, 'onSuccess', 'actions', key])
      }
      for (const [key, a] of Object.entries(action.onError?.actions ?? {})) {
        yield* getActionsInAction(a, [...path, 'onError', 'actions', key])
      }
      for (const [key, a] of Object.entries(action.onMessage?.actions ?? {})) {
        yield* getActionsInAction(a, [...path, 'onMessage', 'actions', key])
      }
      break
    case 'Custom':
    case undefined:
    case null:
      for (const [eventKey, event] of Object.entries(action.events ?? {})) {
        for (const [key, a] of Object.entries(event?.actions ?? {})) {
          yield* getActionsInAction(a, [
            ...path,
            'events',
            eventKey,
            'actions',
            key,
          ])
        }
      }
      break
    case 'Switch':
      for (const [key, c] of action.cases.entries()) {
        for (const [actionKey, a] of Object.entries(c?.actions ?? {})) {
          yield* getActionsInAction(a, [
            ...path,
            'cases',
            key,
            'actions',
            actionKey,
          ])
        }
      }
      for (const [actionKey, a] of Object.entries(action.default.actions)) {
        yield* getActionsInAction(a, [...path, 'default', 'actions', actionKey])
      }
      break
  }
}

export const isLegacyPluginAction = (
  action: LegacyPluginAction | PluginActionV2,
): action is LegacyPluginAction => {
  return !('version' in action)
}
