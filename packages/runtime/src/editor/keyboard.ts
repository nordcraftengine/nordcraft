import { isInputTarget } from './input'
import { postMessageToEditor } from './postMessageToEditor'

export const initKeyListeners = () => {
  const handleKeyEvent =
    (type: 'keydown' | 'keyup' | 'keypress') => (event: KeyboardEvent) => {
      const isTargetInput = isInputTarget(event)
      const key = event.key.toLowerCase()
      const isCmdShortcut =
        (event.metaKey || event.ctrlKey) &&
        (key === 'd' || // design mode
          key === 'p' || // play mode
          key === 'i' || // interactive mode (formerly test mode)
          key === 'k') // quick actions

      if (isTargetInput && !isCmdShortcut) {
        return
      }

      if (type === 'keydown' && isCmdShortcut) {
        event.preventDefault()
      }

      postMessageToEditor({
        type,
        event: {
          key: event.key,
          code: event.code,
          metaKey: event.metaKey,
          ctrlKey: event.ctrlKey,
          shiftKey: event.shiftKey,
          altKey: event.altKey,
        },
      })
    }

  document.addEventListener('keydown', handleKeyEvent('keydown'))
  document.addEventListener('keyup', handleKeyEvent('keyup'))
  document.addEventListener('keypress', handleKeyEvent('keypress'))
}
