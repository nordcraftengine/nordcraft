import type {
  ActionModel,
  CustomActionArgument,
  CustomActionModel,
  ElementNodeModel,
} from '@nordcraft/core/dist/component/component.types'
import type { FunctionArgument } from '@nordcraft/core/dist/formula/formula'
import { isDefined } from '@nordcraft/core/dist/utils/util'

/**
 * Returns true if the full path is included in any of the pathsToVisit
 * This allows searching only certain sub-trees in the files
 * If pathsToVisit is empty, all paths are searched
 */
export function shouldVisitTree({
  path,
  pathsToVisit = [],
}: {
  path: (string | number)[]
  pathsToVisit?: (string | number)[][]
}) {
  return (
    pathsToVisit.length === 0 ||
    pathsToVisit.some((pathToVisit) =>
      // Either the index is outside the current path (we are deeper in the tree)
      // or the path matches on each index
      pathToVisit.every((p1, i) => i >= path.length || path[i] === p1),
    )
  )
}

/**
 * Returns true if the exact path is included in pathsToVisit
 * This allows searching only certain nodes in the files
 */
export function shouldSearchExactPath({
  path,
  pathsToVisit,
}: {
  path: (string | number)[]
  pathsToVisit: (string | number)[][]
}) {
  return pathsToVisit.some(
    (pathToVisit) =>
      path.length === pathToVisit.length &&
      pathToVisit.every((p1, i) => path[i] === p1),
  )
}

export const isLegacyAction = (
  model: ActionModel,
): model is CustomActionModel => {
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
  'CopyToClipboard',
  'UpdateVariable',
  'Update Variable',
  'Update URL parameter',
  'updateUrlParameters',
  'UpdateQueryParam',
  'Fetch',
  'SetTimeout',
  'SetInterval',
  'FocusElement',
  'Debug',
  'GoToURL',
  'TriggerEvent',
  'Set session cookies',
  '@toddle/setSessionCookies',
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

export const ARRAY_ARGUMENT_MAPPINGS = { List: 'Array' }
export const PREDICATE_ARGUMENT_MAPPINGS = {
  ...ARRAY_ARGUMENT_MAPPINGS,
  'Predicate fx': 'Formula',
}

export const renameArguments = <
  T extends FunctionArgument | CustomActionArgument,
>(
  mappings: Record<string, string>,
  args: T[] | undefined,
): T[] =>
  args?.map((arg) => ({
    ...arg,
    // Let's adjust the names
    name:
      typeof arg.name === 'string'
        ? (mappings[arg.name] ?? arg.name)
        : arg.name,
  })) ?? []
