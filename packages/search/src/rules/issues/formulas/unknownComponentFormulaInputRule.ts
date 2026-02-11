import type { ComponentFormula } from '@nordcraft/core/dist/component/component.types'
import { get } from '@nordcraft/core/dist/utils/collections'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { Rule } from '../../../types'

export const unknownComponentFormulaInputRule: Rule<{
  name?: string | null
}> = {
  code: 'unknown component formula input',
  level: 'error',
  category: 'Unknown Reference',
  visit: (report, { path, files, value, nodeType }) => {
    if (
      nodeType !== 'formula' ||
      value.type !== 'path' ||
      value.path?.[0] !== 'Args' ||
      ['@toddle.parent', 'item', 'index'].includes(value.path[1]) ||
      value.path.length < 2 ||
      path[0] !== 'components' ||
      path[2] !== 'formulas' ||
      path.length < 5
    ) {
      return
    }
    const [components, componentName, formulas, formulaName] = path as string[]
    const formula: ComponentFormula = get(files, [
      components,
      componentName,
      formulas,
      formulaName,
    ])
    const args = formula.arguments ?? []
    const argName = value.path[1]
    if (!isDefined(argName) || !args.some((arg) => arg.name === argName)) {
      report({
        path,
        info: {
          title: 'Unknown component formula input',
          description: `The formula input ${argName ?? ''} doesn't exist as an input for this formula.`,
        },
        details: { name: argName },
      })
    }
  },
}
