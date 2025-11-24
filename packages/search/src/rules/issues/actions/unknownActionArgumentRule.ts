import { isLegacyPluginAction } from '@nordcraft/core/dist/component/actionUtils'
import type { Rule } from '../../../types'

export const unknownActionArgumentRule: Rule<{ name: string }> = {
  code: 'unknown action argument',
  level: 'warning',
  category: 'Unknown Reference',
  visit: (report, { path, files, value, nodeType }) => {
    if (
      nodeType !== 'action-model' ||
      (value.type !== undefined && value.type !== 'Custom') ||
      (value.name ?? '').startsWith('@toddle/')
    ) {
      return
    }
    const referencedAction = (
      value.package ? files.packages?.[value.package]?.actions : files.actions
    )?.[value.name]
    if (!referencedAction) {
      return
    }
    const referencedActionArguments = referencedAction.arguments ?? []
    if (isLegacyPluginAction(referencedAction)) {
      if ((value.arguments?.length ?? 0) > referencedActionArguments.length) {
        ;(value.arguments ?? [])
          .slice(referencedActionArguments.length)
          .forEach((arg, i) => {
            report(
              [...path, 'arguments', referencedActionArguments.length + i],
              {
                name:
                  arg?.name ??
                  `argument at position ${
                    referencedActionArguments.length + i
                  }`,
              },
            )
          })
      }
    } else {
      value.arguments?.forEach((arg, i) => {
        if (
          arg &&
          !referencedActionArguments.some(
            (actionArg) => actionArg.name === arg.name,
          )
        ) {
          report([...path, 'arguments', i], {
            name: arg.name,
          })
        }
      })
    }
  },
}
