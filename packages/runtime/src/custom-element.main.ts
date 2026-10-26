import * as libActions from '@nordcraft/std-lib/dist/actions'
import * as libFormulas from '@nordcraft/std-lib/dist/formulas'
import fastDeepEqual from 'fast-deep-equal'
import { defineComponents } from './custom-element/defineComponents'

const loadCorePlugins = (toddle = window.toddle) => {
  toddle.isEqual = fastDeepEqual

  // load default formulas and actions
  for (const name in libFormulas) {
    const module = (libFormulas as Record<string, any>)[name]
    toddle.registerFormula(
      '@toddle/' + name,
      module.default as any,
      'getArgumentInputData' in module
        ? module.getArgumentInputData
        : undefined,
    )
  }
  for (const name in libActions) {
    const module = (libActions as Record<string, any>)[name]
    toddle.registerAction('@toddle/' + name, module.default)
  }
}

export { defineComponents, loadCorePlugins }
