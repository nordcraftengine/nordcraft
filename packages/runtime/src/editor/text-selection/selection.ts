import { stripNodeIdRepeatIndices } from '../../utils/nodes'
import { postMessageToEditor } from '../postMessageToEditor'

export const handleTextNodeSelection = (node: HTMLElement) => {
  const initialContent = node.innerText
  node.contentEditable = 'plaintext-only'
  window.focus()
  node.focus()

  postMessageToEditor({
    type: 'highlight',
    highlightedNodeId: stripNodeIdRepeatIndices(node.getAttribute('data-id')),
  })

  // Select all text when focusing the text node
  const selection = window.getSelection()
  if (selection) {
    const range = document.createRange()
    range.selectNodeContents(node)
    selection.removeAllRanges()
    selection.addRange(range)
  }

  const finishEditing = () => {
    window.removeEventListener('selected-node-changed', finishEditing)
    node.removeAttribute('contenteditable')
    // Clear selected text
    requestAnimationFrame(() => {
      const selection = window.getSelection()
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

  setTimeout(() => {
    window.addEventListener('selected-node-changed', finishEditing, {
      once: true,
    })
  }, 0)

  node.addEventListener('keydown', (e) => {
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
  })
}
