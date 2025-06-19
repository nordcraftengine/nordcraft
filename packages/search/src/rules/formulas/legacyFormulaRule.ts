import type { FunctionOperation } from '@nordcraft/core/dist/formula/formula'
import { isNordcraftFormula } from '@nordcraft/core/dist/formula/formulaTypes'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import type { Rule } from '../../types'

export const legacyFormulaRule: Rule<{
  name: string
}> = {
  code: 'legacy formula',
  level: 'warning',
  category: 'Deprecation',
  visit: (report, { path, files, value, nodeType }) => {
    if (
      nodeType !== 'formula' ||
      value.type !== 'function' ||
      !isLegacyFormula(value, files)
    ) {
      return
    }
    report(path, { name: value.name })
  },
}

const isLegacyFormula = (
  formula: FunctionOperation,
  files: Omit<ProjectFiles, 'config'> & Partial<Pick<ProjectFiles, 'config'>>,
) => {
  const pluginFormula = files.formulas?.[formula.name]

  if (
    isUpperCase(formula.name) &&
    isDefined(pluginFormula) &&
    !isNordcraftFormula(pluginFormula) &&
    pluginFormula.version === undefined &&
    (builtInFormulas.has(formula.name.toLowerCase()) ||
      legacyFormulas.has(formula.name.toLowerCase()))
  ) {
    return true
  } else {
    return false
  }
}

const isUpperCase = (str: string) => str === str.toUpperCase()

const legacyFormulas = new Set([
  'and',
  'concat',
  'count',
  'default',
  'delete',
  'eq',
  'flat',
  'gt',
  'gte',
  'if',
  'list',
  'lt',
  'lte',
  'mod',
  'neq',
  'or',
  'type',
])

// cSpell: disable
const builtInFormulas = new Set([
  'absolute',
  'add',
  'append',
  'boolean',
  'canshare',
  'capitalize',
  'clamp',
  'concatenate',
  'currenturl',
  'datefromstring',
  'datefromtimestamp',
  'decodebase64',
  'decodeuricomponent',
  'defaultto',
  'deletekey',
  'divide',
  'drop',
  'droplast',
  'encodebase64',
  'encodejson',
  'encodeuricomponent',
  'entries',
  'equals',
  'every',
  'filter',
  'find',
  'findindex',
  'findlast',
  'first',
  'flatten',
  'formatdate',
  'formatnumber',
  'fromentries',
  'get',
  'getelementbyid',
  'getfromlocalstorage',
  'getfromsessionstorage',
  'greaterorequeal',
  'greaterthan',
  'groupby',
  'includes',
  'indexof',
  'join',
  'json',
  'keyby',
  'last',
  'lastindexof',
  'lessorequal',
  'lessthan',
  'lowercase',
  'map',
  'matches',
  'max',
  'min',
  'minus',
  'modulo',
  'multiply',
  'not',
  'notequal',
  'now',
  'number',
  'parsejson',
  'parseurl',
  'randomnumber',
  'range',
  'reduce',
  'replaceall',
  'reverse',
  'round',
  'rounddown',
  'roundup',
  'set',
  'shuffle',
  'size',
  'some',
  'sort_by',
  'split',
  'squareroot',
  'startswith',
  'string',
  'sum',
  'take',
  'takelast',
  'timestamp',
  'trim',
  'typeof',
  'unique',
  'uppercase',
])
// cSpell: enable
