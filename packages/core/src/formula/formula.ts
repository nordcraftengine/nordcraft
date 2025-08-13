/* eslint-disable no-console */
import type { Component, ComponentData } from '../component/component.types'
import type {
  CustomFormulaHandler,
  FormulaHandler,
  FormulaLookup,
  NordcraftMetadata,
  Toddle,
} from '../types'
import { isDefined, toBoolean } from '../utils/util'
import { isToddleFormula } from './formulaTypes'

// Define the some objects types as union of ServerSide and ClientSide runtime types as applyFormula is used in both
declare const document: Document | undefined
type ShadowRoot = DocumentFragment

interface BaseOperation extends NordcraftMetadata {
  label?: string
}

export interface PathOperation extends BaseOperation {
  type: 'path'
  path: string[]
}

type FunctionArgument = {
  name?: string
  isFunction?: boolean
  formula: Formula
}

export interface FunctionOperation extends BaseOperation {
  type: 'function'
  name: string
  display_name?: string | null
  package?: string
  arguments: FunctionArgument[]
  variableArguments?: boolean
}

export interface RecordOperation extends BaseOperation {
  type: 'record'
  entries: FunctionArgument[]
}

export interface ObjectOperation extends BaseOperation {
  type: 'object'
  arguments?: FunctionArgument[]
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
  formulaCache?: Record<
    string,
    {
      get: (data: ComponentData) => any
      set: (data: ComponentData, result: any) => void
    }
  >
  data: ComponentData
  root?: Document | ShadowRoot | null
  package: string | undefined
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
      runtime: 'page' | 'custom-element' | 'preview'
      logErrors: boolean
    }

export function isFormula(f: any): f is Formula {
  return (
    f &&
    typeof f === 'object' &&
    typeof f.type === 'string' &&
    (
      [
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
    ).includes(f.type)
  )
}
export function isFormulaApplyOperation(
  formula: Formula,
): formula is ApplyOperation {
  return formula.type === 'apply'
}

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
        const packageName = formula.package ?? ctx.package
        const newFunc = (
          ctx.toddle ??
          ((globalThis as any).toddle as Toddle<unknown, unknown> | undefined)
        )?.getCustomFormula(formula.name, packageName)
        const legacyFunc: FormulaHandler | undefined = (
          ctx.toddle ?? ((globalThis as any).toddle as Toddle<unknown, unknown>)
        ).getFormula(formula.name)
        if (isDefined(newFunc)) {
          ctx.package = packageName
          const args = formula.arguments.reduce<Record<string, unknown>>(
            (args, arg, i) => ({
              ...args,
              [arg.name ?? `${i}`]: arg.isFunction
                ? (Args: any) =>
                    applyFormula(arg.formula, {
                      ...ctx,
                      data: {
                        ...ctx.data,
                        Args: ctx.data.Args
                          ? { ...Args, '@toddle.parent': ctx.data.Args }
                          : Args,
                      },
                    })
                : applyFormula(arg.formula, ctx),
            }),
            {},
          )
          try {
            return isToddleFormula(newFunc)
              ? applyFormula(newFunc.formula, {
                  ...ctx,
                  data: { ...ctx.data, Args: args },
                })
              : newFunc.handler(args, {
                  root: ctx.root ?? document,
                  env: ctx.env,
                } as any)
          } catch (e) {
            ctx.toddle.errors.push(e as Error)
            if (ctx.env?.logErrors) {
              console.error(e)
            }
            return null
          }
        } else if (typeof legacyFunc === 'function') {
          const args = (formula.arguments ?? []).map((arg) =>
            arg.isFunction
              ? (Args: any) =>
                  applyFormula(arg.formula, {
                    ...ctx,
                    data: {
                      ...ctx.data,
                      Args: ctx.data.Args
                        ? { ...Args, '@toddle.parent': ctx.data.Args }
                        : Args,
                    },
                  })
              : applyFormula(arg.formula, ctx),
          )
          try {
            return legacyFunc(args, ctx as any)
          } catch (e) {
            ctx.toddle.errors.push(e as Error)
            if (ctx.env?.logErrors) {
              console.error(e)
            }
            return null
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
      case 'object':
        return Object.fromEntries(
          formula.arguments?.map((entry) => [
            entry.name,
            applyFormula(entry.formula, ctx),
          ]) ?? [],
        )
      case 'record': // object used to be called record, there are still examples in the wild.
        return Object.fromEntries(
          formula.entries.map((entry) => [
            entry.name,
            applyFormula(entry.formula, ctx),
          ]),
        )
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
        const Input = Object.fromEntries(
          formula.arguments.map((arg) =>
            arg.isFunction
              ? [
                  arg.name,
                  (Args: any) =>
                    applyFormula(arg.formula, {
                      ...ctx,
                      data: {
                        ...ctx.data,
                        Args: ctx.data.Args
                          ? { ...Args, '@toddle.parent': ctx.data.Args }
                          : Args,
                      },
                    }),
                ]
              : [arg.name, applyFormula(arg.formula, ctx)],
          ),
        )
        const data = {
          ...ctx.data,
          Args: ctx.data.Args
            ? { ...Input, '@toddle.parent': ctx.data.Args }
            : Input,
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
