import type {
  CustomProperty,
  CustomPropertyName,
} from '@nordcraft/core/dist/component/component.types'
import type { CssSyntax } from '@nordcraft/core/dist/styling/customProperty'
import type { StyleTokenCategory } from '@nordcraft/core/dist/styling/theme'
import type { Nullable } from '@nordcraft/core/dist/types'
import { get, set } from '@nordcraft/core/dist/utils/collections'
import type {
  FixFunction,
  NodeType,
  Rule,
  StyleVariableNode,
} from '../../../types'
import { removeFromPathFix } from '../../../util/removeUnused.fix'

export const legacyStyleVariableRule: Rule<
  {
    name: string
  },
  NodeType,
  StyleVariableNode
> = {
  code: 'legacy style variable',
  level: 'warning',
  category: 'Deprecation',
  visit: (report, data) => {
    if (data.nodeType !== 'style-variable') {
      return
    }

    report(data.path, { name: data.value.styleVariable.name }, [
      'replace-legacy-style-variable',
    ])
  },
  fixes: {
    'replace-legacy-style-variable': replaceLegacyStyleVariable,
  },
}

export type LegacyStyleVariableRuleFix = 'replace-legacy-style-variable'

function replaceLegacyStyleVariable(
  args: Parameters<FixFunction<StyleVariableNode, { name: string }>>[0],
): ReturnType<FixFunction<StyleVariableNode, { name: string }>> {
  const { name, category, formula, unit } = args.data.value.styleVariable
  const customPropertiesPath = [
    'components',
    args.data.path[1],
    'nodes',
    args.data.path[3],
    'customProperties',
  ]
  const key: CustomPropertyName = `--${name}`
  const value: CustomProperty = {
    formula,
    unit,
    syntax: {
      type: 'primitive',
      name:
        (CATEGORY_TO_SYNTAX_PRIMITIVE[category] as Nullable<CssSyntax>) ?? '*',
    },
  }

  return set(removeFromPathFix(args), customPropertiesPath, {
    ...(get(args.data.files, customPropertiesPath) ?? {}),
    [key]: value,
  })
}

const CATEGORY_TO_SYNTAX_PRIMITIVE: Record<
  StyleTokenCategory | 'rotation' | 'duration',
  CssSyntax
> = {
  'border-radius': 'length-percentage',
  color: 'color',
  'font-size': 'length-percentage',
  'font-weight': 'number',
  'z-index': 'integer',
  spacing: 'length-percentage',
  shadow: '*',
  rotation: 'angle',
  duration: 'time',
}
