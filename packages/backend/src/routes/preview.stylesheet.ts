import { isPageComponent } from '@nordcraft/core/dist/component/isPageComponent'
import { createStylesheet } from '@nordcraft/core/dist/styling/style.css'
import { theme as defaultTheme } from '@nordcraft/core/dist/styling/theme.const'
import { takeIncludedComponents } from '@nordcraft/ssr/dist/components/utils'
import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import type { Context } from 'hono'
import type { HonoEnv } from '../../hono'

export const stylesheetHandler = async (
  ctx: Context<
    HonoEnv<{ files: ProjectFiles }>,
    '/.toddle/stylesheet/:pageName{.+.css}'
  >,
) => {
  let pageName = ctx.req.param('pageName')
  // Remove the .css extension
  pageName = pageName.slice(0, '.css'.length * -1)
  const files = ctx.get('files')
  const page = files?.components?.[pageName]
  if (!page || !isPageComponent(page)) {
    return new Response(null, {
      headers: { 'content-type': 'text/css' },
      status: 404,
    })
  }
  // Find the theme to use for the page
  const themes = files.themes ?? {
    defaultTheme: files.config?.theme ?? defaultTheme,
  }

  // Get all included components on the page
  const includedComponents = takeIncludedComponents({
    root: page,
    projectComponents: files.components,
    packages: files.packages,
    includeRoot: true,
  })

  const styles = createStylesheet(page, includedComponents, themes, {
    // The reset stylesheet is loaded separately
    includeResetStyle: false,
    // Font faces are created from a stylesheet referenced in the head
    createFontFaces: false,
  })
  return ctx.text(styles, 200, { 'content-type': 'text/css' })
}
