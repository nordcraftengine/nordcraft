import { GlobalRegistrator } from '@happy-dom/global-registrator'

// Test files share one process, and registering twice throws ("Happy DOM has
// already been globally registered"), so only register once.
if (!(globalThis as any).__nordcraftHappyDomRegistered) {
  ;(globalThis as any).__nordcraftHappyDomRegistered = true
  try {
    GlobalRegistrator.register()
  } catch (e) {
    if (
      !(e instanceof Error) ||
      !e.message.includes('already been globally registered')
    ) {
      throw e
    }
  }
}
