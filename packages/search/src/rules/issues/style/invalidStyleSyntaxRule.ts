import { parse } from 'postcss'
import type { IssueRule, StyleNode } from '../../../types'
import { removeFromPathFix } from '../../../util/removeUnused.fix'

// Hoisted: previously re-created on every style-declaration visit.
const FORMULA_REFERENCE_PATTERN =
  /\b(Variables|Formulas|Event|Attributes|Apis|Parameters|ListItem|URLParameters)\.\w+/i

// Standard properties (`color`, `max-width`) and custom properties (`--x`).
// Anything else (empty, `{`, props containing comments/newlines from pasted
// CSS) falls through to postcss so behavior is unchanged.
const SAFE_PROP_PATTERN = /^(--[\w-]+|-?[a-zA-Z][a-zA-Z0-9-]*)$/

// Postcss `parse(prop: value)` only throws on structurally unbalanced input
// (unclosed block/bracket/string/comment). Balanced declarations with a sane
// property always parse, so a single linear scan lets us skip the parser for
// the vast majority of styles (1972 unique declarations in nordcraft.com,
// ~0 invalid).
const hasUnbalancedSyntax = (value: string): boolean => {
  const stack: string[] = []
  let inSingle = false
  let inDouble = false
  let inComment = false
  let escaped = false
  for (let i = 0; i < value.length; i++) {
    const ch = value[i]
    if (inComment) {
      if (ch === '*' && value[i + 1] === '/') {
        inComment = false
        i++
      }
      continue
    }
    if (escaped) {
      escaped = false
      continue
    }
    if (inSingle) {
      if (ch === '\\') {
        escaped = true
      } else if (ch === "'") {
        inSingle = false
      }
      continue
    }
    if (inDouble) {
      if (ch === '\\') {
        escaped = true
      } else if (ch === '"') {
        inDouble = false
      }
      continue
    }
    if (ch === "'") {
      inSingle = true
    } else if (ch === '"') {
      inDouble = true
    } else if (ch === '/' && value[i + 1] === '*') {
      inComment = true
      i++
    } else if (ch === '(' || ch === '[' || ch === '{') {
      stack.push(ch)
    } else if (ch === ')' || ch === ']' || ch === '}') {
      const open = stack.pop()
      if (
        (ch === ')' && open !== '(') ||
        (ch === ']' && open !== '[') ||
        (ch === '}' && open !== '{')
      ) {
        return true
      }
    }
  }
  return (
    stack.length > 0 || inSingle || inDouble || inComment || escaped
  )
}

export const invalidStyleSyntaxRule: IssueRule<
  {
    property: string
  },
  StyleNode
> = {
  code: 'invalid style syntax',
  level: 'error',
  category: 'Quality',
  nodeTypes: 'style-declaration',
  visit: (report, { value, path, memo }) => {
    // Check for variable/formula references: Variables., Formulas., Event., Attributes., Apis., Parameters., ListItem., URLParameters.
    if (typeof value.styleValue === 'string') {
      // Cheap pre-filter: the pattern requires a `.`, so values without one
      // (the majority: `red`, `16px`, `flex`) skip the regex entirely.
      if (
        value.styleValue.includes('.') &&
        FORMULA_REFERENCE_PATTERN.test(value.styleValue)
      ) {
        report({
          path,
          info: {
            title: `Formulas detected in style declaration`,
            description: `The style declaration for the property "${value.styleProperty}" contains Nordcraft formula syntax (e.g., references like "Variables.xxx", "Event.xxx", "Attributes.xxx", etc.). Formulas should not be used directly in CSS style values. Use style-variables or computed styles instead.`,
          },
          details: { property: value.styleProperty },
          fixes: ['delete-style-property'],
        })
        return
      }
    }

    const valid = memo(
      `valid-style-${value.styleProperty}:${value.styleValue}`,
      () => {
        // Fast path: a sane property with balanced value syntax always
        // parses. Only structurally suspicious declarations pay for postcss.
        if (
          typeof value.styleProperty === 'string' &&
          SAFE_PROP_PATTERN.test(value.styleProperty) &&
          (typeof value.styleValue === 'number' ||
            (typeof value.styleValue === 'string' &&
              !hasUnbalancedSyntax(value.styleValue)))
        ) {
          return true
        }
        try {
          parse(`${value.styleProperty}: ${value.styleValue}`)
          return true
        } catch {
          return false
        }
      },
    )
    if (!valid) {
      report({
        path,
        info: {
          title: `Invalid style declaration`,
          description: `The style declaration for the property "${value.styleProperty}" is invalid. This can lead to unforeseen styling behavior across other elements. Please fix the style declaration or remove it.`,
        },
        details: { property: value.styleProperty },
        fixes: ['delete-style-property'],
      })
    }
  },
  fixes: {
    'delete-style-property': removeFromPathFix,
  },
}

export type InvalidStyleSyntaxRuleFix = 'delete-style-property'
