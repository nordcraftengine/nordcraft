import { set } from '@nordcraft/core/dist/utils/collections'
import type { ComponentContext, FixFunction } from '../../../types'

export const removeContextFormulaSubscription: FixFunction<
  ComponentContext,
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

  const contexts = component.contexts
  if (!contexts?.[providerName]) {
    return
  }

  const updatedFormulas = contexts[providerName].formulas.filter(
    (f) => f !== formulaName,
  )

  if (
    updatedFormulas.length === 0 &&
    contexts[providerName].workflows.length === 0
  ) {
    // If no formulas or workflows remain, we can remove the entire context subscription
    const { [providerName]: _, ...updatedContexts } = contexts
    return set(
      files,
      ['components', componentName, 'contexts'],
      updatedContexts,
    )
  }

  return set(
    files,
    ['components', componentName, 'contexts', providerName, 'formulas'],
    updatedFormulas,
  )
}
