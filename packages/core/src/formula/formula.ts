/* eslint-disable max-params */
/* eslint-disable no-console */
import '../compileTime'
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

// Set lookup is O(1) instead of O(n) `Array.includes` — `isFormula` sits on
// the hottest path (every single formula evaluation), so this matters.
const FORMULA_TYPES_SET: Set<string> = new Set(FORMULA_TYPES)

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
  jsonPath?: Array<string | number> | undefined
  reportFormulaEvaluation?: FormulaEvaluationReporter | undefined
  env: ToddleEnv | undefined
}

/**
 * The part of the formula context that stays stable across evaluations.
 * `data` is passed separately to `applyFormula` so hot paths can reuse a
 * single context object instead of spreading `{ ...ctx, data }` for every
 * single formula evaluation (which allocates a throwaway object per eval
 * and pressures the GC).
 */
export type BaseFormulaContext = Omit<FormulaContext, 'data'>

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
    f !== null &&
    typeof f === 'object' &&
    typeof f.type === 'string' &&
    FORMULA_TYPES_SET.has(f.type)
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

type FormulaType = Formula | string | number | undefined | null | boolean
type Path = Array<string | number> | undefined

// Overload to allow for including data in `ctx` (legacy) or pass data as a separate argument (new)
// TODO: There is likely still some performance to gain by always passing data separately
export function applyFormula(
  formula: FormulaType,
  ctx: FormulaContext,
  data?: ComponentData,
  extendedPath?: Path,
): any
export function applyFormula(
  formula: FormulaType,
  ctx: Omit<FormulaContext, 'data'> & Partial<Pick<FormulaContext, 'data'>>,
  data: ComponentData,
  extendedPath?: Path,
): any
export function applyFormula(
  formula: FormulaType,
  ctx: Omit<FormulaContext, 'data'> & Partial<Pick<FormulaContext, 'data'>>,
  data?: ComponentData,
  extendedPath?: Path,
): any {
  const _data = (data ?? ctx.data) as ComponentData

  if (IS_PREVIEW && ctx.reportFormulaEvaluation) {
    const jsonPath = [...(ctx.jsonPath ?? []), ...(extendedPath ?? [])]
    const _ctx = { ...ctx, jsonPath }
    const report = (value: any, p: Array<string | number> = jsonPath) => {
      ctx.reportFormulaEvaluation?.(p, value, _ctx)
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
          return report(applyPathFormula(formula, _data))
        }
        case 'switch': {
          if (
            _ctx.reportFormulaEvaluation &&
            _ctx.jsonPath.length < MAX_REPORT_DEPTH
          ) {
            return report(applyEvaluateAllSwitchFormula(formula, _ctx, _data))
          }
          return applySwitchFormula(formula, _ctx, _data)
        }
        case 'or': {
          if (
            _ctx.reportFormulaEvaluation &&
            _ctx.jsonPath.length < MAX_REPORT_DEPTH
          ) {
            return report(applyEvaluateAllOrFormula(formula, _ctx, _data))
          }
          return applyOrFormula(formula, _ctx, _data)
        }
        case 'and': {
          if (
            _ctx.reportFormulaEvaluation &&
            _ctx.jsonPath.length < MAX_REPORT_DEPTH
          ) {
            return report(applyEvaluateAllAndFormula(formula, _ctx, _data))
          }
          return applyAndFormula(formula, _ctx, _data)
        }
        case 'object': {
          return report(applyObjectFormula(formula, _ctx, _data))
        }
        case 'record': {
          // object used to be called record, there are still examples in the wild.
          return report(applyRecordFormula(formula, _ctx, _data))
        }
        case 'array': {
          return report(applyArrayFormula(formula, _ctx, _data))
        }
        case 'function': {
          return report(applyFunctionFormula(formula, _ctx, _data))
        }
        case 'apply': {
          return report(applyApplyFormula(formula, _ctx, _data))
        }
        default:
          if (_ctx.env?.logErrors) {
            console.error('Could not recognize formula', formula)
          }
      }
    } catch (e) {
      if (_ctx.env?.logErrors) {
        console.error(e)
      }
      return report(null)
    }

    return report(undefined)
  }

  if (!isFormula(formula)) {
    return formula
  }
  try {
    switch (formula.type) {
      case 'value':
        return formula.value
      case 'path':
        return applyPathFormula(formula, _data)
      case 'switch':
        return applySwitchFormula(formula, ctx, _data)
      case 'or':
        return applyOrFormula(formula, ctx, _data)
      case 'and':
        return applyAndFormula(formula, ctx, _data)
      case 'object':
        return applyObjectFormula(formula, ctx, _data)
      case 'record':
        return applyRecordFormula(formula, ctx, _data)
      case 'array':
        return applyArrayFormula(formula, ctx, _data)
      case 'function':
        return applyFunctionFormula(formula, ctx, _data)
      case 'apply':
        return applyApplyFormula(formula, ctx, _data)
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

  return undefined
}
