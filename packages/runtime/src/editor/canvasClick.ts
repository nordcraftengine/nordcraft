import type { Component } from '@nordcraft/core/dist/component/component.types'
import { stripNodeIdRepeatIndices } from '../utils/nodes'
import { getDOMNodeFromNodeId, getNodeId, lookupNodeAndAncestors } from './dom'
import { postMessageToEditor } from './postMessageToEditor'

export const handleCanvasPointerEvent = (options: {
  event: {
    x: number
    y: number
    type: string
    metaKey?: boolean
  }
  mode: 'design' | 'test'
  component: Component | null
  selectedNodeId: string | null
  highlightedNodeId: string | null
  metaKey: boolean
  onHighlight?: (highlightedNodeId: string | null) => void
}) => {
  const { event, mode, component, selectedNodeId, highlightedNodeId, metaKey } =
    options

  if (mode === 'test' || !component) {
    return
  }

  const { x, y, type } = event
  const elementsAtPoint = document.elementsFromPoint(x, y)
  const element = elementsAtPoint.find((elem) => {
    const id = elem.getAttribute('data-id')
    if (
      typeof id !== 'string' ||
      component === null ||
      elem.getAttribute('data-component')
    ) {
      return false
    }
    const nodeId = getNodeId(component, id.split('.').slice(1))
    const node = nodeId ? component?.nodes?.[nodeId] : undefined
    if (!node) {
      return false
    }
    if (elem.getAttribute('data-node-type') === 'text') {
      // For click events, only select text nodes if metaKey is pressed or it's a double-click.
      // For mousemove (hover), always match so text nodes can be highlighted.
      if (type === 'click') {
        return metaKey
      }
      return true
    }
    return true
  })

  const id = element?.getAttribute('data-id') ?? null
  const elementIsSameAsSelected = id && id === selectedNodeId
  if (
    elementIsSameAsSelected &&
    element?.getAttribute('data-node-type') === 'text'
  ) {
    if (type === 'mousemove' && highlightedNodeId !== null) {
      postMessageToEditor({
        type: 'highlight',
        highlightedNodeId: null,
        exactHighlightedNodeId: null,
      })
      options.onHighlight?.(null)
    }
    return
  }

  if (type === 'click') {
    if (event.metaKey) {
      // Figure out if the clicked element is a text element
      // or if one of its descendants is a text element
      const nodeLookup = lookupNodeAndAncestors(component, id)
      if (nodeLookup?.node.type === 'text') {
        postMessageToEditor({
          type: 'selection',
          selectedNodeId: id,
        })
      } else {
        const firstTextChild =
          nodeLookup?.node.type === 'element'
            ? nodeLookup.node.children?.find(
                (c) => component?.nodes?.[c]?.type === 'text',
              )
            : undefined
        if (firstTextChild) {
          postMessageToEditor({
            type: 'selection',
            selectedNodeId: `${id}.0`,
          })
        }
      }
    } else {
      postMessageToEditor({
        type: 'selection',
        selectedNodeId: id,
      })
    }
  } else if (type === 'mousemove' && id !== highlightedNodeId) {
    // Do not send highlight if cursor is inside current selectedElement and current selected element is a text type
    const selectedNode = getDOMNodeFromNodeId(selectedNodeId)
    const selectedNodeIsText =
      selectedNode?.getAttribute('data-node-type') === 'text'
    const cursorInsideSelectedElement =
      selectedNode instanceof HTMLElement &&
      selectedNode.contains(document.elementFromPoint(x, y))
    if (selectedNodeIsText && cursorInsideSelectedElement) {
      if (highlightedNodeId !== null) {
        postMessageToEditor({
          type: 'highlight',
          highlightedNodeId: null,
          exactHighlightedNodeId: null,
        })
        options.onHighlight?.(null)
      }
      return
    }

    postMessageToEditor({
      type: 'highlight',
      highlightedNodeId: stripNodeIdRepeatIndices(id),
      exactHighlightedNodeId: id,
    })
    options.onHighlight?.(id)
  } else if (
    type === 'dblclick' &&
    id &&
    // We only allow dblclick --> navigation if we're not in test mode
    mode === 'design'
  ) {
    // Figure out if the clicked element is a component
    const nodeLookup = lookupNodeAndAncestors(component, id)
    if (nodeLookup?.node.type === 'component' && nodeLookup.node.name) {
      postMessageToEditor({
        type: 'navigate',
        name: nodeLookup.node.name,
      })
    }
    // Double click on text node should select the text node for editing
    else if (nodeLookup?.node.type === 'text') {
      postMessageToEditor({
        type: 'selection',
        selectedNodeId: id,
      })
    }
  }
}
