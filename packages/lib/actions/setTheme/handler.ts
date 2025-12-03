import type { ActionHandler } from '@nordcraft/core/dist/types'

const handler: ActionHandler = async function ([name], ctx) {
  if (ctx.env.runtime === 'custom-element') {
    ctx.triggerActionEvent(
      'Error',
      new Error(
        'The "Set theme" action is not supported in Custom Element runtime. Set the theme using the "data-theme" attribute on the HTML element instead.',
      ),
    )
    return
  }

  if (name === null || name === '') {
    // Remove cookie so the server falls back to default theme resolution
    document.cookie = `theme=; Path=/; Max-Age=0; SameSite=Lax; Secure`
    document.documentElement.removeAttribute('data-theme')
    return
  }

  if (typeof name === 'string') {
    // Set a cookie so the server knows which theme to use next time
    document.cookie = `theme=${name}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`

    // Update HTML tag attribute so CSS variables are updated immediately
    document.documentElement.setAttribute('data-theme', name)
    return
  }

  ctx.triggerActionEvent(
    'Error',
    new Error('The "Name" argument must be a string or null'),
  )
}

export default handler
