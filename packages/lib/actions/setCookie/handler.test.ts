import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { Window } from 'happy-dom'
import handler from './handler'

// eslint-disable-next-line no-unassigned-vars
let window: Window | undefined

describe('set cookie', async () => {
  beforeEach(() => {
    const window = new Window({ url: 'https://localhost:8080' })
    const document = window.document
    globalThis.document = document as any
  })
  afterEach(async () => {
    await window?.happyDOM.close()
    globalThis.document = undefined as any
  })
  it('should set a cookie', async () => {
    const triggerActionEvent = mock((trigger: string, event: any) => {
      expect(trigger).toBe('Success')
      expect(event).toBe(undefined)
    })
    expect(
      () =>
        handler(['my_cookie', 'my_value', 3600, 'Lax', '/', true], {
          triggerActionEvent,
        } as any) as any,
    ).not.toThrow()
    expect(triggerActionEvent).toHaveBeenCalled()
    expect(document.cookie).toContain('my_cookie=my_value')
  })
  it('should fail for invalid values', async () => {
    const triggerActionEvent = mock((trigger: string, event: any) => {
      expect(trigger).toBe('Error')
      expect(event).toBeInstanceOf(Error)
      expect((event as Error).message).toBe(
        'The "Value" argument must be a string',
      )
    })
    expect(
      () =>
        handler(['my_cookie', { test: 'value' }, 3600, 'Lax', '/'], {
          triggerActionEvent,
        } as any) as any,
    ).not.toThrow()
    expect(
      () =>
        handler(['my_cookie', undefined, 3600, 'Lax', '/'], {
          triggerActionEvent,
        } as any) as any,
    ).not.toThrow()
    expect(triggerActionEvent).toHaveBeenCalledTimes(2)
  })
  it('should fail for invalid names', async () => {
    const triggerActionEvent = mock((trigger: string, event: any) => {
      expect(trigger).toBe('Error')
      expect(event).toBeInstanceOf(Error)
      expect((event as Error).message).toBe(
        'The "Name" argument must be a string',
      )
    })
    expect(
      () =>
        handler([42, 'value', 3600, 'Lax', '/'], {
          triggerActionEvent,
        } as any) as any,
    ).not.toThrow()
    expect(
      () =>
        handler([undefined, 'value', 3600, 'Lax', '/'], {
          triggerActionEvent,
        } as any) as any,
    ).not.toThrow()
    expect(triggerActionEvent).toHaveBeenCalledTimes(2)
  })
  it('should fail for invalid ttl', async () => {
    const triggerActionEvent = mock((trigger: string, event: any) => {
      expect(trigger).toBe('Error')
      expect(event).toBeInstanceOf(Error)
      expect((event as Error).message).toBe(
        'The "Expires in" argument must be a number',
      )
    })
    expect(
      () =>
        handler(['my_cookie', 'value', '3600', 'Lax', '/'], {
          triggerActionEvent,
        } as any) as any,
    ).not.toThrow()
    expect(triggerActionEvent).toHaveBeenCalled()
  })
  it('should fail for invalid SameSite', async () => {
    const triggerActionEvent = mock((trigger: string, event: any) => {
      expect(trigger).toBe('Error')
      expect(event).toBeInstanceOf(Error)
      expect((event as Error).message).toBe(
        'The "SameSite" argument must be "Lax", "Strict" or "None"',
      )
    })
    expect(
      () =>
        handler(['my_cookie', 'value', '3600', 'Invalid', '/'], {
          triggerActionEvent,
        } as any) as any,
    ).not.toThrow()
    expect(triggerActionEvent).toHaveBeenCalled()
  })
  it('should fail for invalid Path', async () => {
    const triggerActionEvent = mock((trigger: string, event: any) => {
      expect(trigger).toBe('Error')
      expect(event).toBeInstanceOf(Error)
      expect((event as Error).message).toBe(
        'The "Path" argument must be a string and start with /',
      )
    })
    expect(
      () =>
        handler(['my_cookie', 'value', 3600, 'Lax', 'invalid'], {
          triggerActionEvent,
        } as any) as any,
    ).not.toThrow()
    expect(triggerActionEvent).toHaveBeenCalled()
  })
  it('should fail for an invalid subdomain setting', async () => {
    const triggerActionEvent = mock((trigger: string, event: any) => {
      expect(trigger).toBe('Error')
      expect(event).toBeInstanceOf(Error)
      expect((event as Error).message).toBe(
        'The "Include Subdomains" argument must be a boolean',
      )
    })
    expect(
      () =>
        handler(['my_cookie', 'value', 3600, 'Lax', '/', 7], {
          triggerActionEvent,
        } as any) as any,
    ).not.toThrow()
    expect(triggerActionEvent).toHaveBeenCalled()
  })
})
