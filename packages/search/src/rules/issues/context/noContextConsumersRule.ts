import type { Rule } from '../../../types'

/**
 * Rule for checking if a component exposes formulas or workflows
 * in context but has no slots or components that could consume them
 */
export const noContextConsumersRule: Rule<{
  providerName: string
  formulaName: string
}> = {
  code: 'no context consumers',
  level: 'warning',
  category: 'Quality',
  visit: (report, { path, value, nodeType }) => {
    if (nodeType !== 'component') {
      return
    }
    const exposesFormulas = Object.values(value.formulas ?? {}).some(
      (f) => f.exposeInContext,
    )
    const exposesWorkflows = Object.values(value.workflows ?? {}).some(
      (w) => w.exposeInContext,
    )
    if (!exposesFormulas && !exposesWorkflows) {
      return
    }
    const hasSlots = Object.values(value.nodes).some((n) => n.type === 'slot')
    if (hasSlots) {
      return
    }
    const hasComponents = Object.values(value.nodes).some(
      (n) => n.type === 'component',
    )
    if (hasComponents) {
      return
    }
    report(path)
  },
}
