import { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import type { Rule } from '../../../types'
import { removeFromPathFix } from '../../../util/removeUnused.fix'

export const noReferenceComponentFormulaRule: Rule<{
  name: string
  contextSubscribers: string[]
}> = {
  code: 'no-reference component formula',
  level: 'warning',
  category: 'No References',
  visit: (report, args) => {
    if (args.nodeType !== 'component-formula') {
      return
    }

    const { path, files, value, component } = args
    const [, componentName, , formulaKey] = path
    for (const {
      path: formulaPath,
      formula,
    } of component.formulasInComponent()) {
      if (
        formula.type === 'apply' &&
        formula.name === formulaKey &&
        // Disregard own formula reference.
        // Similar to typescript etc. we do not report purely circular references, only references to self:
        // A -> B -> A is not reported as unused, as removing A would break B and vice versa. Even if they are
        // ultimately unused, removing one and breaking the other is likely an unintended side effect.
        !(formulaPath[0] === 'formulas' && formulaPath[1] === formulaKey)
      ) {
        return
      }
    }

    // Short circuit if the component is exported and the formula is exposed in context, as it is always indirectly used
    if (value.exposeInContext && component.exported) {
      return
    }

    // It is possible that a formula is never used, but still has subscribers
    const contextSubscribers: string[] = []
    if (value.exposeInContext) {
      for (const _component of Object.values(files.components)) {
        // Enforce that the component is not undefined since we're iterating
        const component = _component!
        for (const [contextKey, context] of Object.entries(
          component.contexts ?? {},
        )) {
          if (
            contextKey === componentName &&
            context.formulas.includes(formulaKey.toString())
          ) {
            contextSubscribers.push(component.name)
            const contextComponent = new ToddleComponent({
              component,
              getComponent: (name) => files.components[name],
              packageName: undefined,
              globalFormulas: {
                formulas: files.formulas,
                packages: files.packages,
              },
            })
            for (const { formula } of contextComponent.formulasInComponent()) {
              if (
                formula.type === 'path' &&
                formula.path[0] === 'Contexts' &&
                formula.path[1] === componentName &&
                formula.path[2] === formulaKey
              ) {
                return
              }
            }
          }
        }
      }
    }
    report(
      args.path,
      {
        contextSubscribers,
        name: value.name,
      },
      ['delete-component-formula'],
    )
  },
  fixes: {
    'delete-component-formula': removeFromPathFix,
  },
}

export type NoReferenceComponentFormulaRuleFix = 'delete-component-formula'
