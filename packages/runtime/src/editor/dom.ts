import type {
  Component,
  NodeModel,
} from '@nordcraft/core/dist/component/component.types'
import type { Signal } from '../signal/signal'
import {
  getNodeAndAncestors,
  isNodeOrAncestorConditional,
} from '../utils/nodes'
import {
  DATA_ATTR_COMPONENT,
  DATA_ATTR_ID,
  DATA_ATTR_NODE_TYPE,
  DATA_ATTR_REPEAT_SELECTED,
  DATA_ATTR_SELECTED,
  DATA_NODE_TYPE_TEXT,
} from './const'
import type { EditorMode } from './types'

export function stripNodeIdRepeatIndices(nodeId: string | null): string | null {
  if (!nodeId) {
    return null
  }

  return nodeId
    .split('.')
    .map((part) => part.split('(')[0].split('{')[0])
    .join('.')
}

export const escapeRegex = (str: string) =>
  str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function getRepeatNodeIndex(
  nodeId: string | null | undefined,
  nodeOrElement?: NodeModel | Element | null,
): number | null {
  if (!nodeId) {
    return null
  }

  const matches = [...nodeId.matchAll(/\((\d+)\)/g)]
  if (matches.length > 0) {
    const lastMatch = matches[matches.length - 1]
    return parseInt(lastMatch[1], 10)
  }

  if (nodeOrElement) {
    if ('repeat' in nodeOrElement && Boolean(nodeOrElement.repeat)) {
      return 0
    }
    if (typeof Element !== 'undefined' && nodeOrElement instanceof Element) {
      const parent = nodeOrElement.parentElement ?? nodeOrElement.parentNode
      if (parent && 'children' in parent) {
        const repeatRegex = new RegExp(`^${escapeRegex(nodeId)}\\(\\d+\\)$`)
        const hasRepeatSibling = Array.from(parent.children).some((child) => {
          if (child === nodeOrElement) return false
          const id = child.getAttribute(DATA_ATTR_ID)
          return id && repeatRegex.test(id)
        })
        if (hasRepeatSibling) {
          return 0
        }
      }
    }
  } else if (typeof document !== 'undefined') {
    const elem = document.querySelector(
      `[${DATA_ATTR_ID}="${nodeId}"]:not([${DATA_ATTR_COMPONENT}])`,
    )
    if (elem?.parentElement) {
      const repeatRegex = new RegExp(`^${escapeRegex(nodeId)}\\(\\d+\\)$`)
      const hasRepeatSibling = Array.from(elem.parentElement.children).some(
        (child) => {
          if (child === elem) return false
          const id = child.getAttribute(DATA_ATTR_ID)
          return id && repeatRegex.test(id)
        },
      )
      if (hasRepeatSibling) {
        return 0
      }
    }
  }

  return null
}

export function getDOMNodeFromNodeId(
  selectedNodeId: string | null | undefined,
  allowDataComponentAttr?: boolean,
  keepRepeatIndices?: boolean,
) {
  if (!selectedNodeId) {
    return null
  }
  const nodeId = keepRepeatIndices
    ? selectedNodeId
    : stripNodeIdRepeatIndices(selectedNodeId)
  if (allowDataComponentAttr) {
    return document.querySelector(`[${DATA_ATTR_ID}="${nodeId}"]`)
  }

  return document.querySelector(
    `[${DATA_ATTR_ID}="${nodeId}"]:not([${DATA_ATTR_COMPONENT}])`,
  )
}

export function getNodeId(component: Component, path: string[]) {
  function getId(
    [nextChild, ...remainingPath]: string[],
    currentId: string | undefined,
  ) {
    if (nextChild === undefined || currentId === undefined) {
      return currentId ?? null
    }
    const currentNode = component.nodes?.[currentId]
    if (!currentNode?.children) {
      return null
    }

    return getId(remainingPath, currentNode.children[parseInt(nextChild)])
  }
  return getId(path, 'root')
}

export const lookupNodeAndAncestors = (
  comp: Component | null,
  id: string | null,
) => {
  const root = comp?.nodes?.root
  if (!comp || !root || !id) {
    return undefined
  }
  return getNodeAndAncestors(comp, root, id)
}

/**
 * Get the current representation of the component, but with
 * updated conditions based on selectedNodeId
 */
export const getCurrentComponent = (
  component: Component | null,
  selectedNodeId: string | null,
  mode: EditorMode,
) => {
  if (!component) {
    return null
  }

  const cloned = structuredClone(component)
  if (mode === 'design') {
    if (selectedNodeId !== null) {
      const nodeLookup = lookupNodeAndAncestors(cloned, selectedNodeId)
      if (nodeLookup) {
        if (isNodeOrAncestorConditional(nodeLookup)) {
          // Show the selected node and all its ancestors by
          // removing their "show" condition
          nodeLookup.node.condition = undefined
          nodeLookup.ancestors.forEach((a) => (a.condition = undefined))
        }
      }
    }
  }
  return cloned
}

export const updateConditionalElements = (options: {
  selectedNodeId: string | null
  component: Component | null
  mode: EditorMode
  showSignal: Signal<{ displayedNodes: string[]; testMode: boolean }>
}) => {
  const { selectedNodeId, component, mode, showSignal } = options
  const displayedNodes: string[] = []
  if (selectedNodeId && component) {
    const nodeLookup = lookupNodeAndAncestors(component, selectedNodeId)
    if (nodeLookup && isNodeOrAncestorConditional(nodeLookup)) {
      displayedNodes.push(selectedNodeId)
      displayedNodes.push(
        ...[...nodeLookup.ancestors, nodeLookup.node]
          .filter((a) => a.condition)
          .map((a) => a.nodeId),
      )
    }
  }
  showSignal.set({
    displayedNodes,
    testMode: mode === 'test',
  })
}

export const NC_EDITOR_HIGHLIGHTED_CLASS = 'nc-editor-highlighted'

export function markHighlightedTextNode(options: {
  highlightedNodeId: string | null | undefined
  selectedNodeId: string | null | undefined
  mode?: EditorMode
}) {
  document.querySelectorAll(`.${NC_EDITOR_HIGHLIGHTED_CLASS}`).forEach((el) => {
    el.classList.remove(NC_EDITOR_HIGHLIGHTED_CLASS)
  })

  const { highlightedNodeId, selectedNodeId, mode = 'design' } = options

  if (mode === 'test' || !highlightedNodeId) {
    return
  }

  const node =
    document.querySelector(
      `[${DATA_ATTR_ID}="${highlightedNodeId}"]:not([${DATA_ATTR_COMPONENT}])`,
    ) ?? getDOMNodeFromNodeId(highlightedNodeId)

  if (!node) {
    return
  }

  const isTextNode =
    node.getAttribute(DATA_ATTR_NODE_TYPE) === DATA_NODE_TYPE_TEXT &&
    node.tagName.toLowerCase() === 'span'
  const isSelected =
    node.hasAttribute(DATA_ATTR_SELECTED) ||
    node.hasAttribute(DATA_ATTR_REPEAT_SELECTED) ||
    (Boolean(selectedNodeId) &&
      stripNodeIdRepeatIndices(selectedNodeId ?? null) ===
        stripNodeIdRepeatIndices(node.getAttribute(DATA_ATTR_ID)))

  if (isTextNode && !isSelected) {
    node.classList.add(NC_EDITOR_HIGHLIGHTED_CLASS)
  }
}
