/* eslint-disable no-console */
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

// Allowing max-params for performance reasons as this function is called 1000s of times, and alternative is destructuring which adds noticeable garbage collection overhead
// eslint-disable-next-line max-params
export function applyFormula(
  formula: Formula | string | number | undefined | null | boolean,
  ctx: FormulaContext,
  dataOrExtendedPath?: ComponentData | Array<string | number> | undefined,
  args?: any,
  packageName?: string | null,
  jsonPath?: Array<string | number> | undefined,
  extendedPath?: Array<string | number> | undefined,
): any {
  let data: ComponentData
  let actualExtendedPath: Array<string | number> | undefined = extendedPath

  if (Array.isArray(dataOrExtendedPath)) {
    data = ctx.data ?? ({ Attributes: {}, Variables: {} } as ComponentData)
    actualExtendedPath = dataOrExtendedPath
  } else {
    data =
      dataOrExtendedPath ??
      ctx.data ??
      ({ Attributes: {}, Variables: {} } as ComponentData)
  }

  const currentArgs = args !== undefined ? args : data?.Args
  const currentPackage = packageName !== undefined ? packageName : ctx.package

  // Short-circuit when not reporting to avoid unnecessary overhead of creating new objects and function
  if (!ctx.reportFormulaEvaluation) {
    if (!isFormula(formula)) {
      return formula
    }
    try {
      switch (formula.type) {
        case 'value':
          return formula.value
        case 'path':
          return applyPathFormula(formula, data, currentArgs)
        case 'switch':
          return applySwitchFormula(
            formula,
            ctx,
            data,
            currentArgs,
            currentPackage,
            jsonPath,
          )
        case 'or':
          return applyOrFormula(
            formula,
            ctx,
            data,
            currentArgs,
            currentPackage,
            jsonPath,
          )
        case 'and':
          return applyAndFormula(
            formula,
            ctx,
            data,
            currentArgs,
            currentPackage,
            jsonPath,
          )
        case 'object':
          return applyObjectFormula(
            formula,
            ctx,
            data,
            currentArgs,
            currentPackage,
            jsonPath,
          )
        case 'record':
          return applyRecordFormula(
            formula,
            ctx,
            data,
            currentArgs,
            currentPackage,
            jsonPath,
          )
        case 'array':
          return applyArrayFormula(
            formula,
            ctx,
            data,
            currentArgs,
            currentPackage,
            jsonPath,
          )
        case 'function':
          return applyFunctionFormula(
            formula,
            ctx,
            data,
            currentArgs,
            currentPackage,
            jsonPath,
          )
        case 'apply':
          return applyApplyFormula(
            formula,
            ctx,
            data,
            currentArgs,
            currentPackage,
            jsonPath,
          )
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

  const basePath = jsonPath !== undefined ? jsonPath : (ctx.jsonPath ?? [])
  const currentPath = actualExtendedPath
    ? [...basePath, ...actualExtendedPath]
    : basePath

  const _ctx = { ...ctx, jsonPath: currentPath, package: currentPackage }
  const report = (value: any, p: Array<string | number> = currentPath) => {
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
        return report(applyPathFormula(formula, data, currentArgs))
      }
      case 'switch': {
        if (
          _ctx.reportFormulaEvaluation &&
          _ctx.jsonPath.length < MAX_REPORT_DEPTH
        ) {
          return report(
            applyEvaluateAllSwitchFormula(
              formula,
              ctx,
              data,
              currentArgs,
              currentPackage,
              currentPath,
            ),
          )
        }
        return applySwitchFormula(
          formula,
          ctx,
          data,
          currentArgs,
          currentPackage,
          currentPath,
        )
      }
      case 'or': {
        if (
          _ctx.reportFormulaEvaluation &&
          _ctx.jsonPath.length < MAX_REPORT_DEPTH
        ) {
          return report(
            applyEvaluateAllOrFormula(
              formula,
              ctx,
              data,
              currentArgs,
              currentPackage,
              currentPath,
            ),
          )
        }
        return applyOrFormula(
          formula,
          ctx,
          data,
          currentArgs,
          currentPackage,
          currentPath,
        )
      }
      case 'and': {
        if (
          _ctx.reportFormulaEvaluation &&
          _ctx.jsonPath.length < MAX_REPORT_DEPTH
        ) {
          return report(
            applyEvaluateAllAndFormula(
              formula,
              ctx,
              data,
              currentArgs,
              currentPackage,
              currentPath,
            ),
          )
        }
        return applyAndFormula(
          formula,
          ctx,
          data,
          currentArgs,
          currentPackage,
          currentPath,
        )
      }
      case 'object': {
        return report(
          applyObjectFormula(
            formula,
            ctx,
            data,
            currentArgs,
            currentPackage,
            currentPath,
          ),
        )
      }
      case 'record': {
        // object used to be called record, there are still examples in the wild.
        return report(
          applyRecordFormula(
            formula,
            ctx,
            data,
            currentArgs,
            currentPackage,
            currentPath,
          ),
        )
      }
      case 'array': {
        return report(
          applyArrayFormula(
            formula,
            ctx,
            data,
            currentArgs,
            currentPackage,
            currentPath,
          ),
        )
      }
      case 'function': {
        return report(
          applyFunctionFormula(
            formula,
            ctx,
            data,
            currentArgs,
            currentPackage,
            currentPath,
          ),
        )
      }
      case 'apply': {
        return report(
          applyApplyFormula(
            formula,
            ctx,
            data,
            currentArgs,
            currentPackage,
            currentPath,
          ),
        )
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
