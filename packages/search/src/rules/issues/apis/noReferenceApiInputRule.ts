import { ToddleApiV2 } from '@nordcraft/core/dist/api/ToddleApiV2'
import type { Rule } from '../../../types'

export const noReferenceApiInputRule: Rule<{ inputName: string }> = {
  code: 'no-reference api input',
  level: 'warning',
  category: 'No References',
  visit: (report, args) => {
    if (args.nodeType !== 'component-api-input') {
      return
    }
    const { path, memo, component, api } = args
    if (!component) {
      return
    }
    const [_components, _componentName, _apis, apiKey, _inputs, inputKey] = path
    if (typeof apiKey !== 'string' || typeof inputKey !== 'string') {
      return
    }
    const apiV2 = new ToddleApiV2(api, apiKey, {
      formulas: args.files.formulas,
      packages: args.files.packages,
    })
    const referencedApiInputs = memo(
      `apiInputReferences/${component.name}/${apiKey}`,
      () => {
        const apiFormulaReferences = apiV2.formulasInApi()
        const referencedApiInputs = new Set<string>()
        for (const { formula } of apiFormulaReferences) {
          if (formula.type === 'path' && formula.path[0] === 'Args') {
            referencedApiInputs.add(formula.path[1])
          }
        }
        return referencedApiInputs
      },
    )
    if (referencedApiInputs.has(inputKey)) {
      return
    }
    report({
      path,
      info: {
        title: 'Unused API input',
        description: `**${inputKey}** is never used by any formulas in the API. Consider removing it.`,
      },
      details: { inputName: inputKey },
    })
  },
}
