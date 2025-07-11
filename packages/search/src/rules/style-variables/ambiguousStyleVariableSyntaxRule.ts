import type { CssSyntaxNode } from '@nordcraft/core/dist/styling/customProperty'
import { getAllCustomPropertiesBySyntax } from '../../memos/getAllCustomPropertiesBySyntax'
import type { Rule } from '../../types'

export const ambiguousStyleVariableSyntaxRule: Rule<{
  name: string
  duplicates: Array<{ path: string[]; syntax: CssSyntaxNode }>
}> = {
  code: 'ambiguous style variable syntax',
  level: 'error',
  category: 'Other',
  visit: (report, args) => {
    const { nodeType, value, files, memo, path } = args
    if (nodeType !== 'component-node') return
    if (value.type !== 'element' && value.type !== 'component') return

    const check = (
      propName: string,
      syntax: CssSyntaxNode,
      basePath: Array<string | number>,
    ) => {
      if (syntax.type !== 'primitive') return
      const allCustomPropertiesBySyntax = getAllCustomPropertiesBySyntax(memo, {
        files,
      })[propName]

      const conflicts = Object.entries(allCustomPropertiesBySyntax)
        .filter(([name]) => name !== syntax.name)
        .flatMap(([, entries]) => entries)

      if (conflicts.length) {
        report(basePath, {
          name: propName,
          duplicates: conflicts,
        })
      }
    }

    for (const [propName, prop] of Object.entries(
      value.customProperties ?? {},
    )) {
      check(propName, prop.syntax, [
        ...path,
        'customProperties',
        propName,
        'name',
      ])
    }

    value.variants?.forEach((variant, variantIndex) => {
      for (const [propName, prop] of Object.entries(
        variant.customProperties ?? {},
      )) {
        check(propName, prop.syntax, [
          ...path,
          'variants',
          String(variantIndex),
          'customProperties',
          propName,
          'name',
        ])
      }
    })
  },
}
