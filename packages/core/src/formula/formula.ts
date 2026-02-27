/* eslint-disable no-console */
import type { Component, ComponentData } from '../component/component.types'
import type {
  CustomFormulaHandler,
  FormulaHandler,
  FormulaLookup,
  NordcraftMetadata,
  Nullable,
  Runtime,
  Toddle,
} from '../types'
import { isDefined, toBoolean } from '../utils/util'
import { type PluginFormula, type ToddleFormula } from './formulaTypes'

// Define the some objects types as union of ServerSide and ClientSide runtime types as applyFormula is used in both
declare const document: Document | undefined
type ShadowRoot = DocumentFragment

interface BaseOperation extends NordcraftMetadata {
  label?: Nullable<string>
}

export interface PathOperation extends BaseOperation {
  type: 'path'
  path: string[]
}

export interface FunctionArgument {
  name?: Nullable<string>
  isFunction?: Nullable<boolean>
  formula: Formula
  type?: Nullable<any>
  testValue?: Nullable<any>
}

export interface FunctionOperation extends BaseOperation {
  type: 'function'
  name: string
  display_name?: Nullable<string>
  package?: Nullable<string>
  arguments: FunctionArgument[]
  variableArguments?: Nullable<boolean>
}

export interface RecordOperation extends BaseOperation {
  type: 'record'
  entries: FunctionArgument[]
}

export interface ObjectOperation extends BaseOperation {
  type: 'object'
  arguments?: Nullable<FunctionArgument[]>
}

export interface ArrayOperation extends BaseOperation {
  type: 'array'
  arguments: Array<{ formula: Formula }>
}

export interface OrOperation extends BaseOperation {
  type: 'or'
  arguments: Array<{ formula: Formula }>
}

export interface AndOperation extends BaseOperation {
  type: 'and'
  arguments: Array<{ formula: Formula }>
}

export interface ApplyOperation extends BaseOperation {
  type: 'apply'
  name: string
  arguments: FunctionArgument[]
}

export interface ValueOperation extends BaseOperation {
  type: 'value'
  value: ValueOperationValue
}

export type ValueOperationValue = string | number | boolean | null | object

export interface SwitchOperation extends BaseOperation {
  type: 'switch'
  cases: Array<{
    condition: Formula
    formula: Formula
  }>
  default: Formula
}

export type Formula =
  | FunctionOperation
  | RecordOperation
  | ObjectOperation
  | ArrayOperation
  | PathOperation
  | SwitchOperation
  | OrOperation
  | AndOperation
  | ValueOperation
  | ApplyOperation

export type FormulaContext = {
  component: Component | undefined
  formulaCache?: Nullable<
    Record<
      string,
      {
        get: (data: ComponentData) => any
        set: (data: ComponentData, result: any) => void
      }
    >
  >
  data: ComponentData
  root?: Nullable<Document | ShadowRoot>
  package: Nullable<string>
  toddle: {
    getFormula: FormulaLookup
    getCustomFormula: CustomFormulaHandler
    errors: Error[]
  }
  env: ToddleEnv | undefined
}

export type ToddleServerEnv = {
  branchName: string
  // isServer will be true for SSR + proxied requests
  isServer: true
  request: {
    headers: Record<string, string>
    cookies: Record<string, string>
    url: string
  }
  runtime: never
  logErrors: boolean
}

export type ToddleEnv =
  | ToddleServerEnv
  | {
      branchName: string
      // isServer will be false for client-side
      isServer: false
      request: undefined
      runtime: Runtime
      logErrors: boolean
    }

const FORMULA_TYPES = [
  'path',
  'function',
  'record',
  'object',
  'array',
  'or',
  'and',
  'apply',
  'value',
  'switch',
] as Formula['type'][]
export function isFormula(f: any): f is Formula {
  if (!f || typeof f !== 'object') {
    return false
  }
  return FORMULA_TYPES.includes(f.type)
}
export function isFormulaApplyOperation(
  formula: Formula,
): formula is ApplyOperation {
  return formula.type === 'apply'
}

export const isToddleFormula = <Handler>(
  formula: PluginFormula<Handler>,
): formula is ToddleFormula =>
  Object.hasOwn(formula, 'formula') &&
  isDefined((formula as ToddleFormula).formula)

export function applyFormula(
  formula: Formula | string | number | undefined | null | boolean,
  ctx: FormulaContext,
): any {
  if (!isFormula(formula)) {
    return formula
  }
  try {
    switch (formula.type) {
      case 'value':
        return formula.value
      case 'path': {
        let input: any = ctx.data
        for (const key of formula.path) {
          if (input && typeof input === 'object') {
            input = input[key]
          } else {
            return null
          }
        }

        return input
      }
      case 'switch': {
        for (const branch of formula.cases) {
          if (toBoolean(applyFormula(branch.condition, ctx))) {
            return applyFormula(branch.formula, ctx)
          }
        }
        return applyFormula(formula.default, ctx)
      }
      case 'or': {
        for (const entry of formula.arguments) {
          if (toBoolean(applyFormula(entry.formula, ctx))) {
            return true
          }
        }
        return false
      }
      case 'and': {
        for (const entry of formula.arguments) {
          if (!toBoolean(applyFormula(entry.formula, ctx))) {
            return false
          }
        }
        return true
      }
      case 'function': {
        const packageName = formula.package ?? ctx.package ?? undefined
        const toddle =
          ctx.toddle ??
          ((globalThis as any).toddle as Toddle<unknown, unknown> | undefined)
        const newFunc = toddle?.getCustomFormula(formula.name, packageName)
        if (isDefined(newFunc)) {
          ctx.package = packageName
          const args: Record<string, unknown> = {}
          const formulaArgs = formula.arguments
          for (let i = 0; i < formulaArgs.length; i++) {
            const arg = formulaArgs[i]!
            const argName = arg.name ?? `${i}`
            if (arg.isFunction) {
              args[argName] = (Args: any) => {
                const parentArgs = ctx.data.Args
                return applyFormula(arg.formula, {
                  ...ctx,
                  data: {
                    ...ctx.data,
                    Args: parentArgs
                      ? { ...Args, '@toddle.parent': parentArgs }
                      : Args,
                  },
                })
              }
            } else {
              args[argName] = applyFormula(arg.formula, ctx)
            }
          }
          try {
            if (isToddleFormula(newFunc)) {
              return applyFormula(newFunc.formula, {
                ...ctx,
                data: { ...ctx.data, Args: args },
              })
            } else {
              return newFunc.handler(args, {
                root: ctx.root ?? document,
                env: ctx.env,
              } as any)
            }
          } catch (e) {
            toddle.errors.push(e as Error)
            if (ctx.env?.logErrors) {
              console.error(e)
            }
            return null
          }
        } else {
          // Lookup legacy formula
          const legacyFunc: FormulaHandler | undefined = toddle?.getFormula(
            formula.name,
          )
          if (typeof legacyFunc === 'function') {
            const formulaArgs = formula.arguments ?? []
            const args = new Array(formulaArgs.length)
            for (let i = 0; i < formulaArgs.length; i++) {
              const arg = formulaArgs[i]!
              if (arg.isFunction) {
                args[i] = (Args: any) => {
                  const parentArgs = ctx.data.Args
                  return applyFormula(arg.formula, {
                    ...ctx,
                    data: {
                      ...ctx.data,
                      Args: parentArgs
                        ? { ...Args, '@toddle.parent': parentArgs }
                        : Args,
                    },
                  })
                }
              } else {
                args[i] = applyFormula(arg.formula, ctx)
              }
            }
            try {
              return legacyFunc(args, ctx as any)
            } catch (e) {
              toddle.errors.push(e as Error)
              if (ctx.env?.logErrors) {
                console.error(e)
              }
              return null
            }
          }
        }
        if (ctx.env?.logErrors) {
          console.error(
            `Could not find formula ${formula.name} in package ${
              packageName ?? ''
            }`,
            formula,
          )
        }
        return null
      }
      case 'object': {
        const res: Record<string, any> = {}
        const args = formula.arguments
        if (args) {
          for (let i = 0; i < args.length; i++) {
            const entry = args[i]!
            if (entry.name) {
              res[entry.name] = applyFormula(entry.formula, ctx)
            }
          }
        }
        return res
      }
      case 'record': {
        // object used to be called record, there are still examples in the wild.
        const res: Record<string, any> = {}
        const entries = formula.entries
        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i]!
          if (entry.name) {
            res[entry.name] = applyFormula(entry.formula, ctx)
          }
        }
        return res
      }
      case 'array':
        return formula.arguments.map((entry) =>
          applyFormula(entry.formula, ctx),
        )
      case 'apply': {
        const componentFormula = ctx.component?.formulas?.[formula.name]
        if (!componentFormula) {
          if (ctx.env?.logErrors) {
            console.log(
              'Component does not have a formula with the name ',
              formula.name,
            )
          }
          return null
        }
        const Input: Record<string, any> = {}
        const formulaArgs = formula.arguments
        for (let i = 0; i < formulaArgs.length; i++) {
          const arg = formulaArgs[i]!
          if (arg.name) {
            if (arg.isFunction) {
              Input[arg.name] = (Args: any) => {
                const parentArgs = ctx.data.Args
                return applyFormula(arg.formula, {
                  ...ctx,
                  data: {
                    ...ctx.data,
                    Args: parentArgs
                      ? { ...Args, '@toddle.parent': parentArgs }
                      : Args,
                  },
                })
              }
            } else {
              Input[arg.name] = applyFormula(arg.formula, ctx)
            }
          }
        }
        const parentArgs = ctx.data.Args
        const data = {
          ...ctx.data,
          Args: parentArgs ? { ...Input, '@toddle.parent': parentArgs } : Input,
        }
        const cache = ctx.formulaCache?.[formula.name]?.get(data)

        if (cache?.hit) {
          return cache.data
        } else {
          const result = applyFormula(componentFormula.formula, {
            ...ctx,
            data,
          })
          ctx.formulaCache?.[formula.name]?.set(data, result)
          return result
        }
      }

      default:
        if (ctx.env?.logErrors) {
          console.error('Could not recognize formula', formula)
        }
    }
  } catch (e) {
    if (ctx.env?.logErrors) {
      console.error(e)
    }
    return null
  }
}
