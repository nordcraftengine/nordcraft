/* eslint-disable no-console */
import { isLegacyPluginAction } from '@nordcraft/core/dist/component/actionUtils'
import type { ToddleEnv } from '@nordcraft/core/dist/formula/formula'
import { isToddleFormula } from '@nordcraft/core/dist/formula/formula'
import type {
  CodeFormula,
  PluginFormula,
  ToddleFormula,
} from '@nordcraft/core/dist/formula/formulaTypes'
import type {
  ActionHandler,
  ActionHandlerV2,
  ArgumentInputDataFunction,
  FormulaHandler,
  FormulaHandlerV2,
  PluginAction,
  PluginActionV2,
  Toddle,
} from '@nordcraft/core/dist/types'
import { filterObject } from '@nordcraft/core/dist/utils/collections'
import { safeFunctionName } from '@nordcraft/core/dist/utils/handlerUtils'
import * as libActions from '@nordcraft/std-lib/dist/actions'
import * as libFormulas from '@nordcraft/std-lib/dist/formulas'
import fastDeepEqual from 'fast-deep-equal'
import { signal } from '../signal/signal'
import type { LocationSignal, PreviewShowSignal } from '../types'

export let env: ToddleEnv

const createCodeHandler = (handler: string, name: string) =>
  new Function(
    'args, ctx',
    `${handler}
    return ${safeFunctionName(name)}(args, ctx)`,
  )

export const registerActions = (
  allActions: Record<string, PluginAction>,
  packageName?: string,
) => {
  const actions: Record<string, PluginActionV2> = {}
  Object.entries(allActions ?? {}).forEach(([name, action]) => {
    if (isLegacyPluginAction(action)) {
      // Legacy actions are self-registering. We need to execute them to register them
      Function(action.handler)()
      return
    }
    // We need to convert the handler string into a real function
    actions[name] = {
      ...(action as PluginActionV2),
      handler:
        typeof action.handler === 'string'
          ? (createCodeHandler(action.handler, action.name) as ActionHandlerV2)
          : action.handler,
    }
  })
  window.toddle.actions[packageName ?? window.__toddle.project] = actions
}

export const registerFormulas = (
  allFormulas: Record<
    string,
    ToddleFormula | CodeFormula<FormulaHandlerV2> | CodeFormula<string>
  >,
  packageName?: string,
) => {
  const formulas: Record<string, PluginFormula<FormulaHandlerV2>> = {}
  Object.entries(allFormulas ?? {}).forEach(([name, formula]) => {
    if (
      !isToddleFormula<FormulaHandlerV2 | string>(formula) &&
      typeof formula.name === 'string' &&
      formula.version === undefined
    ) {
      // Legacy formulas are self-registering. We need to execute them to register them
      Function(formula.handler as unknown as string)()
      return
    } else if (!isToddleFormula<FormulaHandlerV2 | string>(formula)) {
      // For code formulas we need to convert the handler string into a real function
      formulas[name] = {
        ...formula,
        handler:
          typeof formula.handler === 'string'
            ? (createCodeHandler(
                formula.handler,
                formula.name,
              ) as FormulaHandlerV2)
            : formula.handler,
      }
      return
    }
    formulas[name] = formula as PluginFormula<FormulaHandlerV2>
  })
  window.toddle.formulas[packageName ?? window.__toddle.project] = formulas
}

export const initGlobalObject = () => {
  env = {
    isServer: false,
    branchName: window.__toddle.branch,
    request: undefined,
    runtime: 'preview',
    logErrors: true,
  }
  window.toddle = (() => {
    let legacyActions: Record<string, ActionHandler | undefined> = {}
    let legacyFormulas: Record<string, FormulaHandler | undefined> = {}
    const argumentInputDataList: Record<string, ArgumentInputDataFunction> = {}
    const toddle: Toddle<LocationSignal, PreviewShowSignal> = {
      isEqual: fastDeepEqual,
      errors: [],
      formulas: {},
      actions: {},
      registerAction: (name, handler) => {
        if (legacyActions[name]) {
          console.error('There already exists an action with the name ', name)
          return
        }
        legacyActions[name] = handler
      },
      clearLegacyActions: () => {
        legacyActions = filterObject(legacyActions, ([key]) =>
          key.startsWith('@toddle/'),
        )
      },
      getAction: (name) => legacyActions[name],
      registerFormula: (name, handler, getArgumentInputData) => {
        if (legacyFormulas[name]) {
          console.error('There already exists a formula with the name ', name)
          return
        }
        legacyFormulas[name] = handler
        if (getArgumentInputData) {
          argumentInputDataList[name] = getArgumentInputData
        }
      },
      clearLegacyFormulas: () => {
        legacyFormulas = filterObject(legacyFormulas, ([key]) =>
          key.startsWith('@toddle/'),
        )
      },
      getFormula: (name) => legacyFormulas[name],
      getCustomAction: (name, packageName) => {
        return (
          toddle.actions[packageName ?? window.__toddle.project]?.[name] ??
          toddle.actions[window.__toddle.project]?.[name]
        )
      },
      getCustomFormula: (name, packageName) => {
        return (
          toddle.formulas[packageName ?? window.__toddle.project]?.[name] ??
          toddle.formulas[window.__toddle.project]?.[name]
        )
      },
      // eslint-disable-next-line max-params
      getArgumentInputData: (formulaName, args, argIndex, data) =>
        argumentInputDataList[formulaName]?.(args, argIndex, data) || data,
      data: {},
      eventLog: [],
      project: window.__toddle.project,
      branch: window.__toddle.branch,
      commit: window.__toddle.commit,
      components: window.__toddle.components,
      pageState: window.__toddle.pageState,
      locationSignal: signal<any>({
        query: {},
        params: {},
      }),
      env,
    }
    return toddle
  })()

  // load default formulas and actions
  Object.entries(libFormulas).forEach(([name, module]) =>
    window.toddle.registerFormula(
      '@toddle/' + name,
      module.default as FormulaHandler,
      'getArgumentInputData' in module
        ? module.getArgumentInputData
        : undefined,
    ),
  )
  Object.entries(libActions).forEach(([name, module]) =>
    window.toddle.registerAction('@toddle/' + name, module.default),
  )
}
