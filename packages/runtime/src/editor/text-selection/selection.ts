import { stripNodeIdRepeatIndices } from '../../utils/nodes'
import { postMessageToEditor } from '../postMessageToEditor'

export const handleTextNodeSelection = (node: HTMLElement) => {
  const initialContent = node.innerText
  node.contentEditable = 'plaintext-only'
  const nodeId = node.getAttribute('data-id')
  postMessageToEditor({
    type: 'highlight',
    highlightedNodeId: stripNodeIdRepeatIndices(nodeId),
    exactHighlightedNodeId: nodeId,
  })

  const handleKeyDown = (e: KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
      e.preventDefault()
      finishEditing()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      node.textContent = initialContent
      finishEditing()
    }
  }

  const finishEditing = () => {
    globalThis.removeEventListener('selected-node-changed', finishEditing)
    node.removeAttribute('contenteditable')
    node.removeEventListener('keydown', handleKeyDown)
    node.removeEventListener('blur', finishEditing)
    // Clear selected text
    requestAnimationFrame(() => {
      const selection = globalThis.getSelection()
      if (selection) {
        selection.removeAllRanges()
      }
    })

    // Loose tab focus from document entirely
    if (document.activeElement === node) {
      ;(document.activeElement as HTMLElement).blur()
    }

    if (node.innerText === initialContent) {
      return
    }

    postMessageToEditor({
      type: 'updateTextNodeContent',
      innerText: node.innerText,
      nodeId: node.getAttribute('data-node-id'),
    })
  }

  node.addEventListener('keydown', handleKeyDown)
  node.addEventListener('blur', finishEditing, { once: true })
  setTimeout(() => {
    globalThis.addEventListener('selected-node-changed', finishEditing, {
      once: true,
    })
  }, 0)
}
