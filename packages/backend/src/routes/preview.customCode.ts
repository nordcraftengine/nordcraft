import { isDefined } from '@nordcraft/core/dist/utils/util'
import {
  generateCustomCodeFile,
  takeReferencedFormulasAndActions,
} from '@nordcraft/ssr/dist/custom-code/codeRefs'
import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import type { Context } from 'hono'
import type { HonoEnv, HonoProject } from '../../hono'

/**
 * Generates custom code for a specific page component.
 */
export const customCode = async (
  ctx: Context<
    HonoEnv<{ files: ProjectFiles } & HonoProject>,
    '/.toddle/custom-code/:pageName{.+.js}'
  >,
) => {
  let pageName = ctx.req.param('pageName')
  // Remove the .js extension
  pageName = pageName.slice(0, '.js'.length * -1)
  const files = ctx.get('files')
  const component = files?.components[pageName]
  if (!isDefined(component)) {
    return ctx.text(`Component "${pageName}" not found in project`, {
      status: 404,
    })
  }

  const code = takeReferencedFormulasAndActions({
    component,
    files,
  })
  const project = ctx.get('project')
  const output = generateCustomCodeFile({
    code,
    componentName: component.name,
    projectId: project.short_id,
  })
  const headers: Record<string, string> = {
    'content-type': 'text/javascript',
    'Access-Control-Allow-Origin': '*',
  }
  return new Response(output, {
    headers,
  })
}
