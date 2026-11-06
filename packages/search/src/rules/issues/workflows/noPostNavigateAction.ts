import type { ActionModel, Nullable } from '@nordcraft/core'
import { filterObject, get, isDefined, isObject } from '@nordcraft/core'
import type {
  ActionModelNode,
  FixFunctionArgs,
  IssueRule,
} from '../../../types'

export const noPostNavigateAction: IssueRule<
  { parameter: string },
  ActionModelNode,
  ActionModelNode
> = {
  code: 'no post navigate action',
  level: 'warning',
  category: 'Quality',
  nodeTypes: 'action-model',
  visit: (report, { path, value, files }) => {
    if (value.type !== undefined || value.name !== '@toddle/gotToURL') {
      return
    }
    const actionsPath = path.slice(0, -1)
    const actions = get(files, actionsPath)
    if (Array.isArray(actions)) {
      const _actionIndex = path.at(-1)
      if (_actionIndex === undefined) {
        return
      }
      const actionIndex = Number(_actionIndex)
      if (actionIndex < actions.length - 1) {
        // If the action is not the last one in the array, report it
        report({
          path,
          info: {
            title: 'Avoid actions after "Go to URL" action',
            description: `The "Go to URL" action should be the last action in a workflow, as subsequent actions might not be evaluated before the browser navigates to the new URL.`,
          },
          fixes: ['delete-following-actions'],
        })
      }
    } else if (isObject(actions) && typeof value.index === 'number') {
      const currentIndex = value.index
      const hasSubsequentAction = Object.values(
        actions as Record<string, Nullable<ActionModel>>,
      ).some(
        (action) =>
          typeof action?.index === 'number' && action.index > currentIndex,
      )
      if (hasSubsequentAction) {
        report({
          path,
          info: {
            title: 'Avoid actions after "Go to URL" action',
            description: `The "Go to URL" action should be the last action in a workflow, as subsequent actions might not be evaluated before the browser navigates to the new URL.`,
          },
          fixes: ['delete-following-actions'],
        })
      }
    }
  },
  fixes: {
    'delete-following-actions': ({
      data: { path, files, value },
    }: FixFunctionArgs<ActionModelNode>) => {
      const actionsPath = path.slice(0, -1)
      const actions = get(files, actionsPath)
      const actionKey = path.at(-1)
      if (actionKey === undefined) {
        return
      }
      if (Array.isArray(actions)) {
        return {
          path: actionsPath,
          value: actions.slice(0, Number(actionKey) + 1),
        }
      }
      if (isObject(actions) && typeof value.index === 'number') {
        const currentIndex = value.index
        return {
          path: actionsPath,
          value: filterObject(
            actions as Record<string, Nullable<ActionModel>>,
            ([_, action]) =>
              !isDefined(action) ||
              typeof action.index !== 'number' ||
              action.index <= currentIndex,
          ),
        }
      }
    },
  },
}

export type NoPostNavigateActionRuleFix = 'delete-following-actions'
