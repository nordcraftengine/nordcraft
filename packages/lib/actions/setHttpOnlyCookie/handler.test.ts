import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from 'bun:test'
import handler from './handler'

const spyFetch = spyOn(globalThis, 'fetch')

describe('set http only cookie', async () => {
  beforeEach(() => {
    spyFetch.mockReset()
  })
  it('should set a cookie', async () => {
    const mockGetExample = async (url: string) => {
      expect(url).toBe(
        '/.toddle/cookies/set-session-cookie?name=my_cookie&value=my_value&sameSite=Lax&path=%2F&ttl=3600',
      )
      return new Response(`{"success":true}`)
    }
    spyFetch.mockImplementation(mockGetExample as any)

    const triggerActionEvent = mock((trigger: string, event: any) => {
      expect(trigger).toBe('Success')
      expect(event).toBe(undefined)
    })
    expect(
      () =>
        handler(['my_cookie', 'my_value', 3600, 'Lax', '/'], {
          triggerActionEvent,
        } as any) as any,
    ).not.toThrow()
    expect(triggerActionEvent).toHaveBeenCalled()
  })
  it('should handle network errors', async () => {
    const mockFailedExample = async () => {
      return new Response('This operation is not permitted', { status: 403 })
    }
    spyFetch.mockImplementation(mockFailedExample as any)

    const triggerActionEvent = mock((trigger: string, event: any) => {
      expect(trigger).toBe('Error')
      expect(event).toBeInstanceOf(Error)
      expect((event as Error).message).toBe('This operation is not permitted')
    })
    expect(
      () =>
        handler(['my_cookie', 'my_value', 3600, 'Lax', '/'], {
          triggerActionEvent,
        } as any) as any,
    ).not.toThrow()
    expect(triggerActionEvent).toHaveBeenCalled()
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
        handler(['my_cookie', 'value', '3600', 'Lax', 'invalid'], {
          triggerActionEvent,
        } as any) as any,
    ).not.toThrow()
    expect(triggerActionEvent).toHaveBeenCalled()
  })
  afterAll(() => {
    spyFetch.mockRestore()
  })
})
