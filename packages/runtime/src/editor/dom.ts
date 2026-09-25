import type { Component } from '@nordcraft/core/dist/component/component.types'
import type { Signal } from '../signal/signal'
import {
  getNodeAndAncestors,
  isNodeOrAncestorConditional,
  stripNodeIdRepeatIndices,
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

export function getDOMNodeFromNodeId(
  selectedNodeId: string | null | undefined,
) {
  if (!selectedNodeId) {
    return null
  }

  return document.querySelector(
    `[${DATA_ATTR_ID}="${stripNodeIdRepeatIndices(selectedNodeId)}"]:not([${DATA_ATTR_COMPONENT}])`,
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
