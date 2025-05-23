import type { ActionModel } from '@nordcraft/core/dist/component/component.types'

export function shouldSearchPath(
  path: (string | number)[],
  pathsToVisit: string[][] = [],
) {
  return (
    pathsToVisit.length === 0 ||
    pathsToVisit.some((pathToVisit) =>
      pathToVisit.every((p1, i) => path[i] === p1),
    )
  )
}

export const isLegacyAction = (model: ActionModel) => {
  switch (model.type) {
    case 'Custom':
    case undefined:
      // Legacy action has no version, while newer ones have a version 2+
      return !model.version && LEGACY_CUSTOM_ACTIONS.has(model.name)
  }
  return false
}

const LEGACY_CUSTOM_ACTIONS = new Set([
  'If',
  'PreventDefault',
  'StopPropagation',
  'Copy To Clipboard',
  'CopyToClipboard',
  'UpdateVariable',
  'Update Variable',
  'Update URL parameter',
  'updateUrlParameters',
  'UpdateQueryParam',
  'Update Query',
  'Fetch',
  'SetTimeout',
  'SetInterval',
  'FocusElement',
  'Debug',
  'GoToURL',
  'TriggerEvent',
  'Set session cookies',
])
