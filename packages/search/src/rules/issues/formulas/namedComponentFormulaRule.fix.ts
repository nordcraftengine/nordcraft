import { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import { get } from '@nordcraft/core/dist/utils/collections'
import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import type { ComponentFormulaNode, FixFunction } from '../../../types'

export const renameNamedComponentFormulaFix: FixFunction<
  ComponentFormulaNode,
  { name: string; formulaKey: string | number }
> = ({ data, details }) => {
  if (!details) {
    return
  }

  const { path, files } = data
  const { name: newKey, formulaKey: oldKey } = details
  const componentName = String(path[1])

  const updatedFiles = structuredClone(files) as ProjectFiles
  const component = updatedFiles.components[componentName]

  if (!component?.formulas) {
    return
  }

  // 1. Update the formula key and remove the name property
  const formula = component.formulas[oldKey]
  if (formula) {
    component.formulas[newKey] = { ...formula }
    delete component.formulas[newKey].name
    delete component.formulas[oldKey]
  }

  const getComponent = (name: string) => updatedFiles.components[name]
  const globalFormulas = {
    formulas: updatedFiles.formulas,
    packages: updatedFiles.packages,
  }

  // 2. Update all references within the same component
  const toddleComponent = new ToddleComponent({
    component,
    getComponent,
    packageName: undefined,
    globalFormulas,
  })

  for (const {
    path: formulaPath,
    formula: f,
  } of toddleComponent.formulasInComponent()) {
    if (f.type === 'apply' && f.name === String(oldKey)) {
      // Disregard own formula reference if it was already updated or at least identify it
      // formulasInComponent returns the formula objects, so we can mutate them in place in our cloned object
      // But we need the actual path in the component object to be sure
      const fullPath = ['components', componentName, ...formulaPath]
      const currentFormula = get(updatedFiles, fullPath)
      if (
        currentFormula?.type === 'apply' &&
        currentFormula.name === String(oldKey)
      ) {
        currentFormula.name = newKey
      }
    }
  }

  // 3. Update context consumer references
  for (const [otherComponentName, otherComponent] of Object.entries(
    updatedFiles.components,
  )) {
    const context = otherComponent?.contexts?.[componentName]
    const formulaIndex = context?.formulas.indexOf(String(oldKey))
    if (!context || formulaIndex === undefined || formulaIndex === -1) {
      continue
    }

    // Update context subscriptions
    context.formulas[formulaIndex] = newKey

    // Update path formulas referencing the context
    const otherToddleComponent = new ToddleComponent({
      component: otherComponent,
      getComponent,
      packageName: undefined,
      globalFormulas,
    })

    for (const {
      path: formulaPath,
      formula: f,
    } of otherToddleComponent.formulasInComponent()) {
      if (
        f.type === 'path' &&
        f.path[0] === 'Contexts' &&
        f.path[1] === componentName &&
        f.path[2] === String(oldKey)
      ) {
        const fullPath = ['components', otherComponentName, ...formulaPath]
        const currentFormula = get(updatedFiles, fullPath)
        if (
          currentFormula?.type === 'path' &&
          currentFormula.path[2] === String(oldKey)
        ) {
          currentFormula.path[2] = newKey
        }
      }
    }
  }

  return updatedFiles
}
