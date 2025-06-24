import { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import { isFormula } from '@nordcraft/core/dist/formula/formula'
import type { Level, Rule } from '../../types'

export function createLimitElementInstancesRule(
  tag: string,
  limit: number = 1,
  level: Level = 'warning',
): Rule<{
  tag: string
  limit: number
}> {
  return {
    code: 'limit element instances',
    level: level,
    category: 'SEO',
    visit: (report, { path, nodeType, value, files }) => {
      if (!(nodeType === 'component' && value.route)) {
        return
      }
      const page = new ToddleComponent({
        // Enforce that the component is not undefined since we're iterating
        component: value,
        getComponent: (name, packageName) =>
          packageName
            ? files.packages?.[packageName]?.components[name]
            : files.components[name],
        packageName: undefined,
        globalFormulas: {
          formulas: files.formulas,
          packages: files.packages,
        },
      })
      const subComponents = page.uniqueSubComponents

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
