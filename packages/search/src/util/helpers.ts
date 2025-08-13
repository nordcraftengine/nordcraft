import type {
  ActionModel,
  ElementNodeModel,
} from '@nordcraft/core/dist/component/component.types'
import { isDefined } from '@nordcraft/core/dist/utils/util'

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

interface BaseInteractiveContent {
  tag: string
}

interface InteractiveContentWithAttributeRequirement
  extends BaseInteractiveContent {
  whenAttributeIsPresent: string
}

interface InteractiveContentWithNegativeAttributeRequirement
  extends BaseInteractiveContent {
  whenAttributeIsNot: { attribute: string; value: string }
}

export type InteractiveContent =
  | BaseInteractiveContent
  | InteractiveContentWithAttributeRequirement
  | InteractiveContentWithNegativeAttributeRequirement

const INTERACTIVE_CONTENT: InteractiveContent[] = [
  { tag: 'button' },
  { tag: 'details' },
  { tag: 'embed' },
  { tag: 'iframe' },
  { tag: 'label' },
  { tag: 'select' },
  { tag: 'textarea' },
  { tag: 'a', whenAttributeIsPresent: 'href' },
  { tag: 'audio', whenAttributeIsPresent: 'controls' },
  { tag: 'img', whenAttributeIsPresent: 'usemap' },
  { tag: 'input', whenAttributeIsNot: { attribute: 'type', value: 'hidden' } },
  { tag: 'object', whenAttributeIsPresent: 'usemap' },
  { tag: 'video', whenAttributeIsPresent: 'controls' },
]

export const interactiveContentElementDefinition = (
  element: ElementNodeModel,
) =>
  INTERACTIVE_CONTENT.find((ic) => {
    if (element.tag !== ic.tag) {
      return false
    }
    if ('whenAttributeIsPresent' in ic) {
      return isDefined(element.attrs[ic.whenAttributeIsPresent])
    }
    if ('whenAttributeIsNot' in ic) {
      const attributeFormula = element.attrs[ic.whenAttributeIsNot.attribute]
      return (
        attributeFormula?.type === 'value' &&
        attributeFormula.value === ic.whenAttributeIsNot.value
      )
    }
    return true
  })
