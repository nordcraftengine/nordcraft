import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { initKeyListeners } from './keyboard'
import type { EditorPostMessageType } from './types'

const isEditorPostMessage = (
  message: unknown,
): message is EditorPostMessageType =>
  typeof message === 'object' && message !== null && 'type' in message

describe('keyboard', () => {
  const messages: EditorPostMessageType[] = []
  const originalAddEventListener = document.addEventListener.bind(document)
  const listeners: Array<{
    type: string
    listener: EventListenerOrEventListenerObject
    options?: boolean | AddEventListenerOptions
  }> = []

  beforeEach(() => {
    messages.length = 0
    listeners.length = 0

    document.addEventListener = (
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions,
    ) => {
      listeners.push({ type, listener, options })
      originalAddEventListener(type, listener, options)
    }

    window.parent.postMessage = (message: unknown) => {
      if (isEditorPostMessage(message)) {
        messages.push(message)
      }
    }

    initKeyListeners()
  })

  afterEach(() => {
    for (const { type, listener, options } of listeners) {
      document.removeEventListener(type, listener, options)
    }
    listeners.length = 0
    document.addEventListener = originalAddEventListener
    document.body.innerHTML = ''
  })

  it('ignores input events in an input element when not a cmd/ctrl + d/p/k/i shortcut', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    const event = new KeyboardEvent('keydown', {
      key: 'a',
      bubbles: true,
      cancelable: true,
    })
    input.dispatchEvent(event)

    expect(messages).toEqual([])
    expect(event.defaultPrevented).toBe(false)
  })

  it('prevents default and posts message for Cmd + D in an input element', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    const event = new KeyboardEvent('keydown', {
      key: 'd',
      code: 'KeyD',
      metaKey: true,
      bubbles: true,
      cancelable: true,
    })
    input.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    expect(messages).toEqual([
      {
        type: 'keydown',
        event: {
          key: 'd',
          code: 'KeyD',
          metaKey: true,
          ctrlKey: false,
          shiftKey: false,
          altKey: false,
        },
      },
    ])
  })

  it('prevents default and posts message for Cmd + P in an input element', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    const event = new KeyboardEvent('keydown', {
      key: 'p',
      code: 'KeyP',
      metaKey: true,
      bubbles: true,
      cancelable: true,
    })
    input.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    expect(messages).toEqual([
      {
        type: 'keydown',
        event: {
          key: 'p',
          code: 'KeyP',
          metaKey: true,
          ctrlKey: false,
          shiftKey: false,
          altKey: false,
        },
      },
    ])
  })

  it('prevents default and posts message for Ctrl + P in an input element (Windows/Linux)', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    const event = new KeyboardEvent('keydown', {
      key: 'p',
      code: 'KeyP',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    })
    input.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    expect(messages).toEqual([
      {
        type: 'keydown',
        event: {
          key: 'p',
          code: 'KeyP',
          metaKey: false,
          ctrlKey: true,
          shiftKey: false,
          altKey: false,
        },
      },
    ])
  })

  it('prevents default and posts message for Cmd + K in an input element', () => {
    const textarea = document.createElement('textarea')
    document.body.appendChild(textarea)
    textarea.focus()

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      code: 'KeyK',
      metaKey: true,
      bubbles: true,
      cancelable: true,
    })
    textarea.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    expect(messages).toEqual([
      {
        type: 'keydown',
        event: {
          key: 'k',
          code: 'KeyK',
          metaKey: true,
          ctrlKey: false,
          shiftKey: false,
          altKey: false,
        },
      },
    ])
  })

  it('prevents default and posts message for Cmd + I in an input element', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    const event = new KeyboardEvent('keydown', {
      key: 'i',
      code: 'KeyI',
      metaKey: true,
      bubbles: true,
      cancelable: true,
    })
    input.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    expect(messages).toEqual([
      {
        type: 'keydown',
        event: {
          key: 'i',
          code: 'KeyI',
          metaKey: true,
          ctrlKey: false,
          shiftKey: false,
          altKey: false,
        },
      },
    ])
  })

  it('handles regular shortcuts outside input elements', () => {
    const event = new KeyboardEvent('keydown', {
      key: 'v',
      code: 'KeyV',
      bubbles: true,
      cancelable: true,
    })
    document.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
    expect(messages).toEqual([
      {
        type: 'keydown',
        event: {
          key: 'v',
          code: 'KeyV',
          metaKey: false,
          ctrlKey: false,
          shiftKey: false,
          altKey: false,
        },
      },
    ])
  })

  it('prevents default for Cmd + D/P/K/I when outside input elements', () => {
    const event = new KeyboardEvent('keydown', {
      key: 'd',
      code: 'KeyD',
      metaKey: true,
      bubbles: true,
      cancelable: true,
    })
    document.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    expect(messages).toEqual([
      {
        type: 'keydown',
        event: {
          key: 'd',
          code: 'KeyD',
          metaKey: true,
          ctrlKey: false,
          shiftKey: false,
          altKey: false,
        },
      },
    ])
  })
})
