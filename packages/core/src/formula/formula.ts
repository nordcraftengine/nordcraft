/* eslint-disable no-console */
import type { Component, ComponentData } from '../component/component.types'
import type {
  CustomFormulaHandler,
  FormulaLookup,
  NordcraftMetadata,
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

// Define the some objects types as union of ServerSide and ClientSide runtime types as applyFormula is used in both
type ShadowRoot = DocumentFragment

interface BaseOperation extends NordcraftMetadata {
  label?: string
}

export interface PathOperation extends BaseOperation {
  type: 'path'
  path: Array<string | number>
}

export interface FunctionArgument {
  name?: string
  isFunction?: boolean
  formula: Formula
  type?: any
  testValue?: any
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

export type ValueOperationValue =
  | string
  | number
  | boolean
  | null
  | object
  | undefined

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

export interface FormulaContext {
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
  jsonPath?: Array<string | number> | undefined
  reportFormulaEvaluation?: FormulaEvaluationReporter
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

export const isToddleFormula = <Handler>(
  formula: PluginFormula<Handler>,
): formula is ToddleFormula =>
  Object.hasOwn(formula, 'formula') &&
  isDefined((formula as ToddleFormula).formula)

export function applyFormula(
  formula: Formula | string | number | undefined | null | boolean,
  _ctx: FormulaContext,
  extendedPath?: Array<string | number> | undefined,
): any {
  const path = [...(_ctx?.jsonPath ?? []), ...(extendedPath ?? [])]
  const ctx = { ..._ctx, jsonPath: path }
  const report = (value: any, p: Array<string | number> = path) => {
    ctx?.reportFormulaEvaluation?.(p, value)
    return value
  }

  if (!isFormula(formula)) {
    return report(formula)
  }
  try {
    switch (formula.type) {
      case 'value':
        return report(formula.value)
      case 'path': {
        return report(applyPathFormula(formula, ctx.data))
      }
      case 'switch': {
        if (ctx.reportFormulaEvaluation) {
          return report(applyEvaluateAllSwitchFormula(formula, ctx))
        }
        return report(applySwitchFormula(formula, ctx))
      }
      case 'or': {
        if (ctx.reportFormulaEvaluation) {
          return report(applyEvaluateAllOrFormula(formula, ctx))
        }
        return report(applyOrFormula(formula, ctx))
      }
      case 'and': {
        if (ctx.reportFormulaEvaluation) {
          return report(applyEvaluateAllAndFormula(formula, ctx))
        }
        return report(applyAndFormula(formula, ctx))
      }
      case 'object':
        return report(applyObjectFormula(formula, ctx))
      case 'record': // object used to be called record, there are still examples in the wild.
        return report(applyRecordFormula(formula, ctx))
      case 'array':
        return report(applyArrayFormula(formula, ctx))
      case 'function': {
        return report(applyFunctionFormula(formula, ctx))
      }
      case 'apply': {
        return report(applyApplyFormula(formula, ctx))
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
    return report(null)
  }
  return report(undefined)
}
