import { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import type {
  ComponentFormulaNode,
  FileUpdate,
  FixFunction,
} from '../../../types'

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

  const component = files.components[componentName]

  if (!component?.formulas) {
    return
  }

  const formula = component.formulas[oldKey]
  if (!formula) {
    return
  }

  // 1. If oldKey === newKey, we only need to delete the `name` property.
  // No references need to be updated since the formula key is unchanged.
  if (String(oldKey) === newKey) {
    return [
      {
        path: ['components', componentName, 'formulas', oldKey, 'name'],
        delete: true,
      },
    ]
  }

  const { name: _, ...cleanFormula } = formula
  const updates: FileUpdate[] = [
    {
      path: ['components', componentName, 'formulas', newKey],
      value: cleanFormula,
    },
    {
      path: ['components', componentName, 'formulas', oldKey],
      delete: true,
    },
  ]

  const getComponent = (name: string) => files.components[name]
  const globalFormulas = {
    formulas: files.formulas,
    packages: files.packages,
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
      const targetPath =
        String(oldKey) !== newKey &&
        formulaPath[0] === 'formulas' &&
        String(formulaPath[1]) === String(oldKey)
          ? [
              'components',
              componentName,
              'formulas',
              newKey,
              ...formulaPath.slice(2),
              'name',
            ]
          : ['components', componentName, ...formulaPath, 'name']

      updates.push({
        path: targetPath,
        value: newKey,
      })
    }
  }

  // 3. Update context consumer references
  for (const [otherComponentName, otherComponent] of Object.entries(
    files.components,
  )) {
    const context = otherComponent?.contexts?.[componentName]
    const formulaIndex = context?.formulas.indexOf(String(oldKey))
    if (!context || formulaIndex === undefined || formulaIndex === -1) {
      continue
    }

    // Update context subscriptions
    updates.push({
      path: [
        'components',
        otherComponentName,
        'contexts',
        componentName,
        'formulas',
        formulaIndex,
      ],
      value: newKey,
    })

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
        updates.push({
          path: ['components', otherComponentName, ...formulaPath, 'path', 2],
          value: newKey,
        })
      }
    }
  }

  return updates
}
