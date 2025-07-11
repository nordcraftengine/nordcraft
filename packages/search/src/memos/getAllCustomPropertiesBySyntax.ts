import type { CssSyntaxNode } from '@nordcraft/core/dist/styling/customProperty'
import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'

export const getAllCustomPropertiesBySyntax = (
  memo: <T>(key: string, fn: () => T) => T,
  {
    files,
  }: {
    files: Omit<ProjectFiles, 'config'> & Partial<Pick<ProjectFiles, 'config'>>
  },
) =>
  memo('allCustomPropertiesBySyntax', () => {
    const store: Record<
      string,
      Record<string, Array<{ syntax: CssSyntaxNode; path: string[] }>>
    > = {}

    const add = (
      propName: string,
      syntax: CssSyntaxNode,
      fullPath: string[],
    ) => {
      if (syntax.type !== 'primitive') return
      const sName = syntax.name
      store[propName] ??= {}
      store[propName][sName] ??= []
      store[propName][sName].push({ syntax, path: fullPath })
    }

    for (const [componentKey, component] of Object.entries(files.components)) {
      for (const [nodeKey, node] of Object.entries(component?.nodes ?? {})) {
        if (node.type !== 'element' && node.type !== 'component') continue

        for (const [propName, prop] of Object.entries(
          node.customProperties ?? {},
        )) {
          add(propName, prop.syntax, [
            'components',
            componentKey,
            'nodes',
            nodeKey,
            'customProperties',
            propName,
          ])
        }

        node.variants?.forEach((variant, variantIndex) => {
          for (const [propName, prop] of Object.entries(
            variant.customProperties ?? {},
          )) {
            add(propName, prop.syntax, [
              'components',
              componentKey,
              'nodes',
              nodeKey,
              'variants',
              String(variantIndex),
              'customProperties',
              propName,
            ])
          }
        })
      }
    }

    return store
  })
