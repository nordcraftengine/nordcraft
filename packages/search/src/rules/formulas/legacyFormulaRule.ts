import type { FunctionOperation } from '@nordcraft/core/dist/formula/formula'
import { isToddleFormula } from '@nordcraft/core/dist/formula/formulaTypes'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import type { NodeType, Rule } from '../../types'
import { replaceLegacyFormula } from './legacyFormulaRule.fix'

export const legacyFormulaRule: Rule<
  {
    name: string
  },
  NodeType
> = {
  code: 'legacy formula',
  level: 'warning',
  category: 'Deprecation',
  visit: (report, data) => {
    if (
      data.nodeType !== 'formula' ||
      data.value.type !== 'function' ||
      !isLegacyFormula(data.value, data.files)
    ) {
      return
    }
    report(
      data.path,
      { name: data.value.name },
      // The TYPE and BOOLEAN formulas cannot be autofixed since the logic has changed between the 2 implementations
      data.value.name !== 'TYPE' && data.value.name !== 'BOOLEAN'
        ? ['replace-legacy-formula']
        : undefined,
    )
  },
  fixes: {
    'replace-legacy-formula': replaceLegacyFormula,
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
    !isToddleFormula(pluginFormula) &&
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
  'default',
  'delete',
  'drop_last',
  'eq',
  'find index',
  'flat',
  'gt',
  'gte',
  'group_by',
  'if',
  'index of',
  'json_parse',
  'key_by',
  'list',
  'lower',
  'lt',
  'lte',
  'mod',
  'neq',
  'or',
  'random',
  'size',
  'sqrt',
  'starts_with',
  'take_last',
  'type',
  'upper',
  'uri_encode',
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
