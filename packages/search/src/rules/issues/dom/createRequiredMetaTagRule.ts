import { isFormula } from '@nordcraft/core/dist/formula/formula'
import type { Level, Rule } from '../../../types'

export function createRequiredMetaTagRule(
  tag: string,
  level: Level = 'warning',
): Rule<{
  tag: string
}> {
  return {
    code: 'required meta tag',
    level: level,
    category: 'SEO',
    visit: (report, { path, nodeType, value }) => {
      if (!(nodeType === 'component' && value.route)) {
        return
      }

      const tagValue = value.route.info?.[tag as keyof typeof value.route.info]
      const formula = isFormula(tagValue?.formula)
        ? tagValue.formula
        : undefined

      if (
        !tagValue ||
        !formula ||
        (formula.type === 'value' && !formula.value)
      ) {
        report(path, { tag: tag })
      }
    },
  }
}
