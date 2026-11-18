import type { SearchRule } from '../../types'
import { getNodeAncestorsContext } from '../../util/searchContext'

// Matches syntax like node: followed by a CSS query like:
// - `node:div.my-class` or `node:.my-class`
// - `node:div[attr="val"]` or `node:[attr="val"]`
// - `node:.fill[path="my-path"]`
// We support tag (optional), classes (multiple), and attributes (multiple selectors).
// We also support wildcards (*) in tags, classes, and attribute values.

const NODE_REGEX = /^node:\s*(.+)$/i

interface parsedCssQuery {
  tag?: string // e.g. "div", can have "*" wildcards
  classes: string[] // e.g. ["foo", "bar"], can have "*" wildcards
  attrs: Array<{
    name: string
    value?: string // if present, can have "*" wildcards
  }>
}

export function parseCssQuery(query: string): parsedCssQuery | null {
  let trimmed = query.trim()
  const prefixMatch = trimmed.match(NODE_REGEX)
  if (prefixMatch) {
    trimmed = prefixMatch[1].trim()
  }

  if (!trimmed) {
    return null
  }

  // Parse CSS query:
  // tag name: optional alphanumeric or '-' or '*'
  // followed by a sequence of .class or [attr=val]
  let tag: string | undefined = undefined
  const classes: string[] = []
  const attrs: Array<{ name: string; value?: string }> = []

  let rest = trimmed

  // Extract tag name if exists
  const tagMatch = rest.match(/^([a-zA-Z0-9-*]+)/)
  if (tagMatch) {
    tag = tagMatch[1]
    rest = rest.slice(tag.length)
  }

  // We should require at least a tag name, a class selector, or an attribute selector
  if (!tag && !rest.startsWith('.') && !rest.startsWith('[')) {
    return null
  }

  while (rest.length > 0) {
    if (rest.startsWith('.')) {
      const classMatch = rest.match(/^\.([a-zA-Z0-9_*-]+)/)
      if (!classMatch) {
        return null // invalid syntax
      }
      classes.push(classMatch[1])
      rest = rest.slice(classMatch[0].length)
    } else if (rest.startsWith('[')) {
      const attrMatch = rest.match(
        /^\[([a-zA-Z0-9_-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\]'"]*)))?\]/,
      )
      if (!attrMatch) {
        return null // invalid syntax
      }
      const attrName = attrMatch[1]
      const attrVal = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4]
      attrs.push({
        name: attrName,
        value: attrVal,
      })
      rest = rest.slice(attrMatch[0].length)
    } else {
      // Any other characters mean it's not a valid CSS element query for our rules
      return null
    }
  }

  return { tag, classes, attrs }
}

export function shouldRun(query: string): boolean {
  const trimmed = query.trim()
  if (trimmed.startsWith('/') && trimmed.endsWith('/') && trimmed.length > 2) {
    return false
  }
  return NODE_REGEX.test(trimmed) && parseCssQuery(trimmed) !== null
}

function matchValueWithWildcard(value: string, pattern: string): boolean {
  const lowercaseValue = value.toLowerCase()
  const lowercasePattern = pattern.toLowerCase()
  if (lowercasePattern === '*') {
    return true
  }
  const regexPattern =
    '^' +
    lowercasePattern
      .replace(/[-/\\^$+.()|[\]{}]/g, '\\$&')
      .replace(/\*/g, '.*') +
    '$'
  return new RegExp(regexPattern).test(lowercaseValue)
}

export function createElementSearchRule({
  query,
}: {
  query: string
}): SearchRule {
  const parsed = parseCssQuery(query)

  return {
    visit: (report, { path, value, nodeType, files }) => {
      if (nodeType !== 'component-node') {
        return
      }

      // We only match elements
      if (value?.type !== 'element') {
        return
      }

      if (!parsed) {
        return
      }

      // 1. Tag match
      if (parsed.tag && parsed.tag !== '*') {
        if (!matchValueWithWildcard(value.tag, parsed.tag)) {
          return
        }
      }

      // 2. Class match - search finds all classes no matter if conditional or not.
      // node.classes is Record<string, { formula?: Formula }>
      const elementClasses = Object.keys(value.classes ?? {})
      for (const expectedClass of parsed.classes) {
        let classFound = false
        for (const ec of elementClasses) {
          if (matchValueWithWildcard(ec, expectedClass)) {
            classFound = true
            break
          }
        }
        if (!classFound) {
          return
        }
      }

      // 3. Attribute match
      // node.attrs is Record<string, Formula>
      for (const expectedAttr of parsed.attrs) {
        const attributeFormula = value.attrs?.[expectedAttr.name]
        if (!attributeFormula) {
          return // Attr doesn't exist
        }

        if (expectedAttr.value !== undefined) {
          // If we have a specific expected value (e.g. [path="my-path"]), we inspect the formula
          // If it's a value formula, we check the exact / wildcard value
          if (attributeFormula.type === 'value') {
            if (
              !matchValueWithWildcard(
                String(attributeFormula.value),
                expectedAttr.value,
              )
            ) {
              return
            }
          } else {
            // Non-static / non-value formula attribute but we expected a specific value.
            // We can check if the formula string matches, or just skip if it's dynamic.
            // To be robust, let's say dynamic attributes don't match specific static values, unless they match a wildcard like "*"
            if (expectedAttr.value !== '*') {
              return
            }
          }
        }
      }

      // All criteria matched!
      // Compute ancestor before context
      const componentName = path[1] as string
      const componentObj = files?.components?.[componentName]
      const nodes = componentObj?.nodes
      const nodeId = path[3] as string
      const ancestors = getNodeAncestorsContext(nodes, nodeId)
      const mappedAncestors = ancestors
        .map((a) =>
          a.type === 'component'
            ? a.name
            : a.type === 'element'
              ? a.tag
              : '<unknown>',
        )
        .join(' > ')
      const beforeContext = mappedAncestors ? `${mappedAncestors} > ` : ''

      // Highlight target node
      const classesString =
        elementClasses.length > 0 ? `.${elementClasses.join('.')}` : ''
      const matchedString = `${value.tag}${classesString}`

      report({
        path,
        details: {
          nodeType: 'component-node',
          context: {
            before: beforeContext,
            matched: matchedString,
            after: '',
          },
        },
      })
    },
  }
}
