import { THEME_COOKIE_NAME } from '@nordcraft/core/dist/styling/theme.const'
import type { ActionHandler } from '@nordcraft/core/dist/types'

const ONE_YEAR = 60 * 60 * 24 * 365

const handler: ActionHandler = async function ([name], ctx) {
  if (typeof name !== 'string' && name !== null) {
    ctx.triggerActionEvent(
      'Error',
      new Error('The "Name" argument must be a string or null'),
    )
    return
  }

  const shouldDelete = name === null || name === ''
  try {
    // Note that the cookie store API is used with event listeners to update
    // the theme signal for reactive updates.
    await cookieStore.set({
      name: THEME_COOKIE_NAME,
      value: name ?? '',
      path: '/',
      expires: shouldDelete ? 0 : Date.now() + ONE_YEAR,
      sameSite: 'none',
    })
    ctx.triggerActionEvent('Success', undefined)
  } catch (error) {
    ctx.triggerActionEvent('Error', error as Error)
  }
}

export default handler
