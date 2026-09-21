/* eslint-disable no-console, max-params */
import type { Component, ComponentData } from '../component/component.types'
import type {
  CustomFormulaHandler,
  FormulaLookup,
  NordcraftMetadata,
  Nullable,
  Runtime,
} from '../types'
import { isDefined } from '../utils/util'
import { applyAndFormula, applyEvaluateAllAndFormula } from './andFormula'
import { applyApplyFormula } from './applyFormula'
import { applyArrayFormula } from './arrayFormula'
import {
  type FormulaEvaluationReporter,
  type PluginFormula,
  type ToddleFormula,
} from './formulaTypes'
import { applyFunctionFormula } from './functionFormula'
import { applyObjectFormula } from './objectFormula'
import { applyEvaluateAllOrFormula, applyOrFormula } from './orFormula'
import { applyPathFormula } from './pathFormula'
import { applyRecordFormula } from './recordFormula'
import {
  applyEvaluateAllSwitchFormula,
  applySwitchFormula,
} from './switchFormula'

// As we are evaluating all branches of "if", "or" & "and" formulas when reportFormulaEvaluation is provided,
// we need to limit the depth to infinite loops as exit conditions are no longer used in recursive formulas.
const MAX_REPORT_DEPTH = 64

// Hoisted to avoid re-allocating the array for every formula evaluation
const FORMULA_TYPES = [
  'and',
  'apply',
  'array',
  'function',
  'object',
  'or',
  'path',
  'record',
  'switch',
  'value',
] as Formula['type'][]

// Define the some objects types as union of ServerSide and ClientSide runtime types as applyFormula is used in both
type ShadowRoot = DocumentFragment

interface BaseOperation extends NordcraftMetadata {
  label?: Nullable<string>
}

export interface PathOperation extends BaseOperation {
  type: 'path'
  path: Array<string | number>
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
  arguments?: Nullable<FunctionArgument[]>
  variableArguments?: Nullable<boolean>
}

export interface RecordOperation extends BaseOperation {
  type: 'record'
  entries?: Nullable<FunctionArgument[]>
}

export interface ObjectOperation extends BaseOperation {
  type: 'object'
  arguments?: Nullable<FunctionArgument[]>
}

export interface ArrayOperation extends BaseOperation {
  type: 'array'
  arguments?: Nullable<Array<{ formula: Formula }>>
}

export interface OrOperation extends BaseOperation {
  type: 'or'
  arguments?: Nullable<Array<{ formula: Formula }>>
}

export interface AndOperation extends BaseOperation {
  type: 'and'
  arguments?: Nullable<Array<{ formula: Formula }>>
}

export interface ApplyOperation extends BaseOperation {
  type: 'apply'
  name: string
  arguments?: Nullable<FunctionArgument[]>
}

export interface ValueOperation extends BaseOperation {
  type: 'value'
  value: ValueOperationValue
}

export type ValueOperationValue =
  | string
  | number
  | boolean
  | null
  | object
  | undefined

export interface SwitchOperation extends BaseOperation {
  type: 'switch'
  cases?: Nullable<
    Array<{
      condition: Formula
      formula: Formula
    }>
  >
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

export interface FormulaContext {
  component?: Component | undefined
  formulaCache?: Nullable<
    Record<
      string,
      {
        get: (data: ComponentData) => any
        set: (data: ComponentData, result: any) => void
      }
    >
  >
  root?: Nullable<Document | ShadowRoot>
  package?: Nullable<string>
  toddle: {
    getFormula: FormulaLookup
    getCustomFormula: CustomFormulaHandler
    errors: Error[]
  }
  jsonPath?: Array<string | number> | undefined
  reportFormulaEvaluation?: FormulaEvaluationReporter | undefined
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

export function isFormula(f: any): f is Formula {
  return (
    f &&
    typeof f === 'object' &&
    typeof f.type === 'string' &&
    FORMULA_TYPES.includes(f.type)
  )
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
  path?: Array<string | number>,
): any
export function applyFormula(
  formula: Formula | string | number | undefined | null | boolean,
  ctx: FormulaContext,
  data?: ComponentData,
  path?: Array<string | number>,
): any
export function applyFormula(
  formula: Formula | string | number | undefined | null | boolean,
  ctx: FormulaContext,
  dataOrPath?: ComponentData | Array<string | number>,
  extendedPath?: Array<string | number> | undefined,
): any {
  let resolvedData: ComponentData | undefined
  let resolvedPath: Array<string | number> | undefined

  if (Array.isArray(dataOrPath)) {
    resolvedPath = dataOrPath
    resolvedData = undefined
  } else {
    resolvedData = dataOrPath
    resolvedPath = extendedPath
  }

  // Short-circuit when not reporting to avoid unnecessary overhead of creating new objects and function
  if (!ctx?.reportFormulaEvaluation) {
    if (!isFormula(formula)) {
      return formula
    }
    try {
      switch (formula.type) {
        case 'value':
          return formula.value
        case 'path':
          return applyPathFormula(formula, resolvedData)
        case 'switch':
          return applySwitchFormula(formula, ctx, resolvedData)
        case 'or':
          return applyOrFormula(formula, ctx, resolvedData)
        case 'and':
          return applyAndFormula(formula, ctx, resolvedData)
        case 'object':
          return applyObjectFormula(formula, ctx, resolvedData)
        case 'record':
          return applyRecordFormula(formula, ctx, resolvedData)
        case 'array':
          return applyArrayFormula(formula, ctx, resolvedData)
        case 'function':
          return applyFunctionFormula(formula, ctx, resolvedData)
        case 'apply':
          return applyApplyFormula(formula, ctx, resolvedData)
        default:
          if (ctx?.env?.logErrors) {
            console.error('Could not recognize formula', formula)
          }
      }
    } catch (e) {
      if (ctx?.env?.logErrors) {
        console.error(e)
      }
      return null
    }

    return undefined
  }

  const jsonPath =
    ctx.jsonPath && resolvedPath
      ? [...ctx.jsonPath, ...resolvedPath]
      : (resolvedPath ?? ctx.jsonPath ?? [])

  const report = (value: any, p: Array<string | number> = jsonPath) => {
    ctx.reportFormulaEvaluation?.(p, value, ctx)
    return value
  }

  if (!isFormula(formula)) {
    return report(formula)
  }
  try {
    switch (formula.type) {
      case 'value': {
        return report(formula.value)
      }
      case 'path': {
        return report(applyPathFormula(formula, resolvedData))
      }
      case 'switch': {
        if (jsonPath.length < MAX_REPORT_DEPTH) {
          return report(
            applyEvaluateAllSwitchFormula(formula, ctx, resolvedData, jsonPath),
          )
        }
        return applySwitchFormula(formula, ctx, resolvedData, jsonPath)
      }
      case 'or': {
        if (jsonPath.length < MAX_REPORT_DEPTH) {
          return report(
            applyEvaluateAllOrFormula(formula, ctx, resolvedData, jsonPath),
          )
        }
        return applyOrFormula(formula, ctx, resolvedData, jsonPath)
      }
      case 'and': {
        if (jsonPath.length < MAX_REPORT_DEPTH) {
          return report(
            applyEvaluateAllAndFormula(formula, ctx, resolvedData, jsonPath),
          )
        }
        return applyAndFormula(formula, ctx, resolvedData, jsonPath)
      }
      case 'object': {
        return report(applyObjectFormula(formula, ctx, resolvedData, jsonPath))
      }
      case 'record': {
        // object used to be called record, there are still examples in the wild.
        return report(applyRecordFormula(formula, ctx, resolvedData, jsonPath))
      }
      case 'array': {
        return report(applyArrayFormula(formula, ctx, resolvedData, jsonPath))
      }
      case 'function': {
        return report(
          applyFunctionFormula(formula, ctx, resolvedData, jsonPath),
        )
      }
      case 'apply': {
        return report(applyApplyFormula(formula, ctx, resolvedData, jsonPath))
      }
      default:
        if (ctx?.env?.logErrors) {
          console.error('Could not recognize formula', formula)
        }
    }
  } catch (e) {
    if (ctx?.env?.logErrors) {
      console.error(e)
    }
    return report(null)
  }

  return report(undefined)
}
