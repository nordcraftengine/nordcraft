import { omit } from '@nordcraft/core/dist/utils/collections'
import type { NodeType, Rule } from '../../types'

export const noReferenceApiRule: Rule<void> = {
  code: 'no-reference api',
  level: 'warning',
  category: 'No References',
  visit: (report, args) => {
    if (!hasReferences(args)) {
      report(args.path, undefined, ['delete-api'])
    }
  },
  fixes: {
    'delete-api': (data) => {
      if (!hasReferences(data)) {
        return omit(data.files, data.path)
      }
    },
  },
}

export type NoReferenceApiRuleFix = 'delete-api'

const hasReferences = (args: NodeType) => {
  if (args.nodeType !== 'component-api') {
    return true
  }
  const { value, memo, component } = args
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!component) {
    return true
  }

  const componentApiReferences = memo(
    `componentApiReferences/${component.name}]`,
    () => {
      const usedApis = new Set<string>()
      for (const { formula } of component.formulasInComponent()) {
        if (
          formula.type === 'path' &&
          formula.path[0] === 'Apis' &&
          typeof formula.path[1] === 'string'
        ) {
          usedApis.add(formula.path[1])
        }
      }
      for (const [, action] of component.actionModelsInComponent()) {
        if (action.type === 'Fetch') {
          usedApis.add(action.api)
        }
      }
      return usedApis
    },
  )
  if (componentApiReferences.has(value.name)) {
    return true
  }
  return false
}
