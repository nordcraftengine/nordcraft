import type { FormulaNode, IssueRule } from '../../../types'

export const unknownProjectFormulaRule: IssueRule<
  { name: string },
  FormulaNode
> = {
  code: 'unknown project formula',
  level: 'warning',
  category: 'Unknown Reference',
  nodeTypes: 'formula',
  visit: (report, { path, files, value }) => {
    if (
      value.type !== 'function' ||
      (value.name ?? '').startsWith('@toddle/')
    ) {
      return
    }
    const formula = (
      value.package ? files.packages?.[value.package]?.formulas : files.formulas
    )?.[value.name]
    if (formula) {
      return
    }
    report({
      path,
      info: {
        title: 'Unknown global formula',
        description: `**${value.name}** does not exist. Using an unknown formula will always return *Null*`,
      },
      details: { name: value.name },
    })
  },
}
