import type {
  ActionModel,
  CustomActionArgument,
  CustomActionModel,
} from '@nordcraft/core/dist/component/component.types'
import { valueFormula } from '@nordcraft/core/dist/formula/formulaUtils'
import { set } from '@nordcraft/core/dist/utils/collections'
import type { ActionModelNode, FixFunction } from '../../../types'
import { renameArguments } from '../../../util/helpers'

export const replaceLegacyAction: FixFunction<
  ActionModelNode<CustomActionModel>
> = ({ path, value, files }) => {
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
        value.arguments?.[0]?.formula?.type === 'value'
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
        arguments: value.arguments
          ? renameArguments(
              { 'Delay in ms': 'Delay in milliseconds' },
              value.arguments,
            )
          : value.arguments,
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
        value.arguments?.[0]?.formula?.type === 'value'
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
                  formula: value.arguments?.[0]?.formula ?? valueFormula(null),
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
}
