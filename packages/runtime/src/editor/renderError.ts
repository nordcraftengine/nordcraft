/* eslint-disable no-console */
import type { Component } from '@nordcraft/core/dist/component/component.types'
import { isPageComponent } from '@nordcraft/core/dist/component/isPageComponent'
import { createPanicScreen } from '../debug/panicScreen'
import { sendEditorToast } from '../debug/sendEditorToast'

export const handleRenderError = (
  error: unknown,
  component: Component,
  domNode: HTMLElement,
) => {
  const isPage = isPageComponent(component)
  let name = `Unexpected error while rendering ${isPage ? 'page' : 'component'}`
  let message = error instanceof Error ? error.message : String(error)
  let panic = false
  if (error instanceof RangeError) {
    // RangeError is unrecoverable
    panic = true
    name = 'Infinite loop detected'
    message =
      'RangeError (Maximum call stack size exceeded): Remove any circular dependencies or recursive calls (Try undoing your last change). This is most likely caused by a component, formula or action using itself.'
  }

  // This can be triggered by setting "type" on a select etc.
  if (error instanceof TypeError) {
    panic = true
    name = 'TypeError'
    message = `Type errors are often caused by:

• Trying to set a read-only property (like "type" on a select element).

• Trying to set a property on an undefined or null value.

• Trying to access a property on an undefined or null value.

• Trying to call a method on an undefined or null value.`
  }

  console.error(name, message, error)

  if (panic) {
    // Show error overlay in the editor until next update
    const panicScreen = createPanicScreen({
      name,
      message,
      isPage,
      cause: error,
    })

    // Replace the inner HTML of the editor preview with the panic screen
    domNode.innerHTML = ''
    domNode.appendChild(panicScreen)
  } else {
    // Otherwise send a toast to the editor with the error (unknown errors may be recoverable), if not please add the error-type to the above
    sendEditorToast(name, message, {
      type: 'critical',
    })
  }
}
