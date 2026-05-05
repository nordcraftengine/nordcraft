import type { FixFunction, FormulaNode } from '../../../types'

export const addContextSubscription: FixFunction<
  FormulaNode,
  {
    providerName: string
    formulaName: string
  }
> = ({ data, details }) => {
  if (!details) {
    return
  }
  const { files, path } = data
  const componentName = path[1] as string
  const { providerName, formulaName } = details

  const component = files.components[componentName]
  if (!component) {
    return
  }

  const contexts = { ...component.contexts }
  const context = contexts[providerName] ?? {
    formulas: [],
    workflows: [],
    componentName: providerName,
  }

  if (context.formulas.includes(formulaName)) {
    return
  }

  const updatedContexts = {
    ...contexts,
    [providerName]: {
      ...context,
      formulas: [...context.formulas, formulaName],
    },
  }

  return {
    ...files,
    components: {
      ...files.components,
      [componentName]: {
        ...component,
        contexts: updatedContexts,
      },
    },
  }
}
