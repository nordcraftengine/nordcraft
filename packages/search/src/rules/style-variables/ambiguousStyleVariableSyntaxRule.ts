import type { CssSyntaxNode } from '@nordcraft/core/dist/styling/customProperty'
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
    if (nodeType !== 'component-node') {
      return
    }

    if (value.type !== 'element' && value.type !== 'component') {
      return
    }

    const allCustomPropertiesBySyntax = memo(
      'allCustomPropertiesBySyntax',
      () => {
        const customPropertiesBySyntax: Record<
          string,
          Array<{ syntax: CssSyntaxNode; path: string[] }>
        > = {}
        Object.entries(files.components).forEach(
          ([componentKey, component]) => {
            Object.entries(component?.nodes ?? {}).forEach(
              ([nodeKey, node]) => {
                if (node.type !== 'element' && node.type !== 'component') {
                  return
                }

                Object.entries(node.customProperties ?? {}).forEach(
                  ([customPropertyName, customProperty]) => {
                    customPropertiesBySyntax[customPropertyName] ??= []
                    customPropertiesBySyntax[customPropertyName].push({
                      syntax: customProperty.syntax,
                      path: [
                        'components',
                        componentKey,
                        'nodes',
                        nodeKey,
                        'customProperties',
                        customPropertyName,
                      ],
                    })
                  },
                )
                node.variants?.forEach((variant, variantIndex) => {
                  Object.entries(variant.customProperties ?? {}).forEach(
                    ([customPropertyName, customProperty]) => {
                      customPropertiesBySyntax[customPropertyName] ??= []
                      customPropertiesBySyntax[customPropertyName].push({
                        syntax: customProperty.syntax,
                        path: [
                          'components',
                          componentKey,
                          'nodes',
                          nodeKey,
                          'variants',
                          String(variantIndex),
                          'customProperties',
                          customPropertyName,
                        ],
                      })
                    },
                  )
                })
              },
            )
          },
        )

        return customPropertiesBySyntax
      },
    )

    Object.entries(value.customProperties ?? {}).forEach(
      ([customPropertyName, customProperty]) => {
        const syntax = customProperty.syntax
        if (syntax.type !== 'primitive') {
          return
        }

        const duplicates = allCustomPropertiesBySyntax[
          customPropertyName
        ].filter(
          ({ syntax: existingSyntax }) =>
            existingSyntax.type === 'primitive' &&
            existingSyntax.name !== syntax.name,
        )

        if (duplicates.length === 0) {
          return
        }

        report([...path, 'customProperties', customPropertyName, 'name'], {
          name: customPropertyName,
          duplicates: duplicates.map(({ path, syntax }) => ({
            path,
            syntax,
          })),
        })
      },
    )

    value.variants?.forEach((variant, variantIndex) => {
      Object.entries(variant.customProperties ?? {}).forEach(
        ([customPropertyName, customProperty]) => {
          const syntax = customProperty.syntax
          if (syntax.type !== 'primitive') {
            return
          }

          const duplicates = allCustomPropertiesBySyntax[
            customPropertyName
          ].filter(
            ({ syntax: existingSyntax }) =>
              existingSyntax.type === 'primitive' &&
              existingSyntax.name !== syntax.name,
          )

          if (duplicates.length === 0) {
            return
          }

          report(
            [
              ...path,
              'variants',
              String(variantIndex),
              'customProperties',
              customPropertyName,
              'name',
            ],
            {
              name: customPropertyName,
              duplicates: duplicates.map(({ path, syntax }) => ({
                path,
                syntax,
              })),
            },
          )
        },
      )
    })
  },
}
