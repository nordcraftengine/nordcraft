import type {
  ActionModel,
  CustomActionModel,
} from '@nordcraft/core/dist/component/component.types'
import type { ActionModelNode, IssueRule, NodeType } from '../../../types'
import { isLegacyAction } from '../../../util/helpers'
import { upgradeCustomAction } from './legacyCustomActionRule.fix'

export const legacyCustomActionRule: IssueRule<
  {
    name: string
  },
  NodeType,
  ActionModelNode<CustomActionModel>
> = {
  code: 'legacy custom action',
  level: 'warning',
  category: 'Deprecation',
  visit: (report, { path, value, nodeType }) => {
    if (nodeType !== 'action-model') {
      return
    }
    // Only custom actions (type `Custom` or typeless legacy models).
    // Built-in action types (Switch, Fetch, etc.) are handled by other rules.
    if (
      value.type !== undefined &&
      (value.type as string | null | undefined) !== null &&
      value.type !== 'Custom'
    ) {
      return
    }
    if (!('name' in value) || typeof value.name !== 'string') {
      return
    }
    const actionName = value.name
    // Built-in (@toddle/*) actions use a different versioning scheme
    if (actionName.startsWith('@toddle/')) {
      return
    }
    // Already on the new format
    if ('version' in value && (value as CustomActionModel).version === 2) {
      return
    }
    // Known legacy built-ins (If, TriggerEvent, etc.) are covered by
    // the `legacy action` rule to avoid duplicate reports
    if (isLegacyAction(value as ActionModel)) {
      return
    }
    report({
      path,
      info: {
        title: 'Legacy custom action',
        description: `**${actionName}** uses the legacy action format. Upgrade it to version 2 to use the new format.`,
      },
      details: { name: actionName },
      fixes: ['upgrade-custom-action'],
    })
  },
  fixes: {
    'upgrade-custom-action': upgradeCustomAction,
  },
}

export type LegacyCustomActionRuleFix = 'upgrade-custom-action'
