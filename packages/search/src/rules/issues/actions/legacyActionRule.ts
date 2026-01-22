import type { CustomActionModel } from '@nordcraft/core/dist/component/component.types'
import type { ActionModelNode, Rule } from '../../../types'
import { isLegacyAction } from '../../../util/helpers'
import { replaceLegacyAction } from './legacyActionRule.fix'

export const legacyActionRule: Rule<
  {
    name: string
  },
  ActionModelNode<CustomActionModel>
> = {
  code: 'legacy action',
  level: 'warning',
  category: 'Deprecation',
  visit: (report, { path, value }) => {
    if (isLegacyAction(value)) {
      let details: { name: string } | undefined
      if ('name' in value) {
        details = {
          name: value.name,
        }
      }
      report(
        path,
        details,
        unfixableLegacyActions.has(value.name)
          ? undefined
          : !formulaNamedActions.includes(value.name) ||
              // Check if the first argument is a value formula with a string value
              (value.arguments?.[0]?.formula?.type === 'value' &&
                typeof value.arguments[0].formula.value === 'string')
            ? ['replace-legacy-action']
            : undefined,
      )
    }
  },
  fixes: {
    'replace-legacy-action': replaceLegacyAction,
  },
}

// These actions take a first argument which is a formula as the name
// of the thing to update/trigger. We can only safely autofix these if
// the argument is a value operation and a string
const formulaNamedActions = [
  'UpdateVariable',
  'Update Variable',
  'TriggerEvent',
]

const unfixableLegacyActions = new Set([
  'CopyToClipboard', // Previously, this action would JSON stringify non-string inputs
  'Update URL parameter', // The user will need to pick a history mode (push/replace)
  'Fetch', // This was mainly used for APIs v1
  '@toddle/setSessionCookies', // The new 'Set cookie' action takes more arguments
])

export type LegacyActionRuleFix = 'replace-legacy-action'
