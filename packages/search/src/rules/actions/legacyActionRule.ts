import type {
  ActionModel,
  CustomActionArgument,
} from '@nordcraft/core/dist/component/component.types'
import { valueFormula } from '@nordcraft/core/dist/formula/formulaUtils'
import { set } from '@nordcraft/core/dist/utils/collections'
import type { Rule } from '../../types'
import { isLegacyAction, renameArguments } from '../../util/helpers'

export const legacyActionRule: Rule<{
  name: string
}> = {
  code: 'legacy action',
  level: 'warning',
  category: 'Deprecation',
  visit: (report, { path, value, nodeType }) => {
    if (nodeType !== 'action-model') {
      return
    }
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
              (value.arguments?.[0].formula.type === 'value' &&
                typeof value.arguments[0].formula.value === 'string')
            ? ['replace-legacy-action']
            : undefined,
      )
    }
  },
  fixes: {
    'replace-legacy-action': ({ path, value, nodeType, files }) => {
      if (nodeType !== 'action-model') {
        return
      }
      if (!isLegacyAction(value)) {
        return
      }

      let newAction: ActionModel | undefined
      switch (value.name) {
        case 'If': {
          const trueActions = value.events?.['true']?.actions ?? []
          const falseActions = value.events?.['false']?.actions ?? []
          const trueCondition: CustomActionArgument | undefined =
            (value.arguments ?? [])[0]
          newAction = {
            type: 'Switch',
            cases: [
              {
                condition: trueCondition?.formula ?? null,
                actions: trueActions,
              },
            ],
            default: { actions: falseActions },
          }
          break
        }
        case 'PreventDefault': {
          newAction = {
            name: '@toddle/preventDefault',
            arguments: [],
            label: 'Prevent default',
          }
          break
        }
        case 'StopPropagation': {
          newAction = {
            name: '@toddle/stopPropagation',
            arguments: [],
            label: 'Stop propagation',
          }
          break
        }
        case 'UpdateVariable':
        case 'Update Variable': {
          const variableName =
            value.arguments?.[0]?.formula.type === 'value'
              ? value.arguments[0].formula.value
              : undefined
          if (typeof variableName !== 'string') {
            break
          }
          const variableValue = value.arguments?.[1]?.formula
          if (!variableValue) {
            break
          }
          newAction = {
            type: 'SetVariable',
            variable: variableName,
            data: variableValue,
          }
          break
        }
        case 'SetTimeout': {
          newAction = {
            ...value,
            name: '@toddle/sleep',
            arguments: renameArguments(
              { 'Delay in ms': 'Delay in milliseconds' },
              value.arguments,
            ),
            events: value.events?.['timeout']
              ? { tick: value.events.timeout }
              : undefined,
            label: 'Sleep',
          }
          break
        }
        case 'SetInterval': {
          newAction = {
            ...value,
            name: '@toddle/interval',
            arguments: renameArguments(
              { 'Interval in ms': 'Interval in milliseconds' },
              value.arguments,
            ),
            label: 'Interval',
          }
          break
        }
        case 'Debug': {
          newAction = {
            ...value,
            name: '@toddle/logToConsole',
            label: 'Log to console',
          }
          break
        }
        case 'GoToURL': {
          newAction = {
            name: '@toddle/gotToURL', // Yes, the typo is in the action name
            arguments: renameArguments({ url: 'URL' }, value.arguments),
            label: 'Go to URL',
          }
          break
        }
        case 'TriggerEvent': {
          const eventName =
            value.arguments?.[0]?.formula.type === 'value'
              ? value.arguments[0].formula.value
              : undefined
          if (typeof eventName !== 'string') {
            break
          }
          const eventData = value.arguments?.[1]?.formula
          if (!eventData) {
            break
          }
          newAction = {
            type: 'TriggerEvent',
            event: eventName,
            data: eventData,
          }
          break
        }
        case 'FocusElement': {
          newAction = {
            name: '@toddle/focus',
            arguments: [
              {
                name: 'Element',
                formula: {
                  type: 'function',
                  name: '@toddle/getElementById',
                  display_name: 'Get element by id',
                  arguments: [
                    {
                      name: 'Id',
                      formula:
                        value.arguments?.[0]?.formula ?? valueFormula(null),
                    },
                  ],
                },
              },
            ],
            label: 'Focus',
          }
        }
      }
      if (newAction) {
        return set(files, path, newAction)
      }
    },
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
