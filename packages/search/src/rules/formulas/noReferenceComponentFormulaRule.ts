import { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import { omit } from '@nordcraft/core/dist/utils/collections'
import type { NodeType, Rule } from '../../types'

export const noReferenceComponentFormulaRule: Rule<{
  name: string
  contextSubscribers: string[]
}> = {
  code: 'no-reference component formula',
  level: 'warning',
  category: 'No References',
  visit: (report, args) => {
    const issueCheck = isIssue(args)
    if (issueCheck) {
      report(args.path, {
        contextSubscribers: issueCheck.contextSubscribers,
        name: issueCheck.name,
      })
    }
  },
  fixes: {
    'delete-component-formula': (data) => {
      if (isIssue(data)) {
        return omit(data.files, data.path)
      }
    },
  },
}

export type NoReferenceComponentFormulaRuleFix = 'delete-component-formula'

const isIssue = (args: NodeType) => {
  if (args.nodeType !== 'component-formula') {
    return false
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
      return false
    }
  }

  // Short circuit if the component is exported and the formula is exposed in context, as it is always indirectly used
  if (value.exposeInContext && component.exported) {
    return false
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
              return false
            }
          }
        }
      }
    }
  }
  return { contextSubscribers, name: value.name }
}
