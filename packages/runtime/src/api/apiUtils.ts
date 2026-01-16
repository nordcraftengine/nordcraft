import type { ToddleRequestInit } from '@nordcraft/core/dist/api/apiTypes'
import type { ContextApi, ContextApiV2 } from '../types'

export const isContextApiV2 = (api: ContextApi): api is ContextApiV2 =>
  'triggerActions' in api

export class ApiAbortHandler {
  private abortControllers: AbortController[] = []

  public applyAbortSignal = (requestInit: ToddleRequestInit) => {
    const abortController = new AbortController()
    this.abortControllers.push(abortController)
    this.cleanupAbortedControllers()
    return {
      ...requestInit,
      signal: requestInit.signal
        ? AbortSignal.any([requestInit.signal, abortController.signal])
        : abortController.signal,
    }
  }

  public abort = () => {
    this.abortControllers.forEach((controller) => {
      controller.abort()
    })
    this.abortControllers = []
  }

  private cleanupAbortedControllers = () => {
    this.abortControllers = this.abortControllers.filter(
      (controller) => !controller.signal.aborted,
    )
  }
}
