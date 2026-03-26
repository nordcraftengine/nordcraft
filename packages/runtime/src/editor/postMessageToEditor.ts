import type { EditorPostMessageType } from './types'

export const postMessageToEditor = (message: EditorPostMessageType) => {
  window.parent?.postMessage(message, '*')
}
