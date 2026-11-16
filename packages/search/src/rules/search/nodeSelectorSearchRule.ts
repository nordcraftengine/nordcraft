import { isDefined, type NodeModel } from '@nordcraft/core'
import type { NodeType } from '../../types'
import {
  matchesSegment,
  type AttributeOperator,
  type NodeAttributeMatcher,
  type NodeSelectorToken,
} from '../../util/parseSearchQuery'

function compareAttributeValue(
  actual: string,
  operator: AttributeOperator,
  expected: string | RegExp | undefined,
): boolean {
  if (expected === undefined) {
    return true
  }
  if (expected instanceof RegExp) {
    return expected.test(actual)
  }
  const actualLower = actual.toLowerCase()
  const expectedLower = expected.toLowerCase()

  switch (operator) {
    case '=':
      return actualLower === expectedLower
    case '*=':
      return actualLower.includes(expectedLower)
    case '^=':
      return actualLower.startsWith(expectedLower)
    case '$=':
      return actualLower.endsWith(expectedLower)
  }
}

function matchesAttribute(
  node: NodeModel,
  attr: NodeAttributeMatcher,
): boolean {
  switch (attr.namespace) {
    case 'style': {
      if (node.type !== 'element' && node.type !== 'component') {
        return false
      }
      const candidates: Array<string | number> = []
      const directVal = node.style?.[attr.name]
      if (isDefined(directVal)) {
        candidates.push(directVal)
      }
      for (const variant of node.variants ?? []) {
        const variantVal = variant.style?.[attr.name]
        if (isDefined(variantVal)) {
          candidates.push(variantVal)
        }
      }
      if (candidates.length === 0) {
        return false
      }
      if (!attr.operator) {
        return true
      }
      return candidates.some((val) =>
        compareAttributeValue(String(val), attr.operator!, attr.value),
      )
    }

    case 'event': {
      if (node.type !== 'element' && node.type !== 'component') {
        return false
      }
      return isDefined(node.events?.[attr.name])
    }

    case 'slot': {
      if (!attr.operator) {
        return isDefined(node.slot)
      }
      const slotVal = node.slot ?? 'default'
      return compareAttributeValue(slotVal, attr.operator, attr.value)
    }

    case undefined: {
      if (node.type === 'slot' && attr.name === 'name') {
        if (!attr.operator) {
          return isDefined(node.name)
        }
        return compareAttributeValue(
          node.name ?? 'default',
          attr.operator,
          attr.value,
        )
      }

      if (node.type !== 'element' && node.type !== 'component') {
        return false
      }

      const attrFormula = node.attrs?.[attr.name]
      if (!isDefined(attrFormula)) {
        return false
      }
      if (!attr.operator) {
        return true
      }
      if (attrFormula.type === 'value') {
        return compareAttributeValue(
          String(attrFormula.value ?? ''),
          attr.operator,
          attr.value,
        )
      }
      return false
    }
  }
}

export function matchNodeSelector(
  data: NodeType,
  token: NodeSelectorToken,
): boolean {
  if (data.nodeType !== 'component-node' || !isDefined(data.value)) {
    return false
  }

  const node = data.value

  if (token.nodeKind !== undefined) {
    switch (token.nodeKind) {
      case 'element': {
        if (node.type === 'element') {
          if (
            token.name !== undefined &&
            !matchesSegment(node.tag, token.name)
          ) {
            return false
          }
        } else if (
          node.type === 'component' &&
          token.name !== undefined &&
          !token.package &&
          matchesSegment(node.name, token.name)
        ) {
          // Allow matching lowercase or wildcard component names via <my-comp> or <*btn*>
        } else {
          return false
        }
        break
      }
      case 'component': {
        if (node.type !== 'component') {
          return false
        }
        if (
          token.package !== undefined &&
          !matchesSegment(node.package, token.package)
        ) {
          return false
        }
        if (
          token.name !== undefined &&
          !matchesSegment(node.name, token.name)
        ) {
          return false
        }
        break
      }
      case 'slot': {
        if (node.type !== 'slot') {
          return false
        }
        break
      }
      case 'text': {
        if (node.type !== 'text') {
          return false
        }
        break
      }
    }
  }

  if (token.id !== undefined) {
    const matchesNodeId = 'id' in node && matchesSegment(node.id, token.id)
    const idAttr =
      node.type === 'element' || node.type === 'component'
        ? node.attrs?.id
        : undefined
    const matchesAttrId =
      idAttr?.type === 'value' &&
      matchesSegment(
        idAttr.value === null || typeof idAttr.value === 'object'
          ? undefined
          : String(idAttr.value ?? ''),
        token.id,
      )
    if (!matchesNodeId && !matchesAttrId) {
      return false
    }
  }

  if (token.classes.length > 0) {
    if (node.type !== 'element') {
      return false
    }
    const staticClassFormula = node.attrs?.class
    const staticClassList =
      staticClassFormula?.type === 'value' &&
      typeof staticClassFormula.value === 'string'
        ? staticClassFormula.value.trim().split(/\s+/)
        : []
    const nodeClassKeys = Object.keys(node.classes ?? {})

    for (const clsMatcher of token.classes) {
      const inClassesObj = nodeClassKeys.some((k) =>
        matchesSegment(k, clsMatcher),
      )
      const inStaticAttr = staticClassList.some((k) =>
        matchesSegment(k, clsMatcher),
      )
      if (!inClassesObj && !inStaticAttr) {
        return false
      }
    }
  }

  for (const attr of token.attributes) {
    if (!matchesAttribute(node, attr)) {
      return false
    }
  }

  return true
}
