import { isInputTarget } from './input'
import { postMessageToEditor } from './postMessageToEditor'

export const initKeyListeners = () => {
  const handleKeyEvent =
    (type: 'keydown' | 'keyup' | 'keypress') => (event: KeyboardEvent) => {
      if (isInputTarget(event)) {
        return
      }
      if (type === 'keydown' && event.key === 'k' && event.metaKey) {
        event.preventDefault()
      }
      postMessageToEditor({
        type,
        event: {
          key: event.key,
          metaKey: event.metaKey,
          shiftKey: event.shiftKey,
          altKey: event.altKey,
        },
      })
    }

  document.addEventListener('keydown', handleKeyEvent('keydown'))
  document.addEventListener('keyup', handleKeyEvent('keyup'))
  document.addEventListener('keypress', handleKeyEvent('keypress'))
}
