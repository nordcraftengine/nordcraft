import { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import { type ToddleServerEnv } from '@nordcraft/core/dist/formula/formula'
import { theme as defaultTheme } from '@nordcraft/core/dist/styling/theme.const'
import type { ToddleInternals } from '@nordcraft/core/dist/types'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import { takeIncludedComponents } from '@nordcraft/ssr/dist/components/utils'
import { renderPageBody } from '@nordcraft/ssr/dist/rendering/components'
import {
  getPageFormulaContext,
  getServerToddleObject,
  serverEnv,
} from '@nordcraft/ssr/dist/rendering/formulaContext'
import {
  getHeadItems,
  renderHeadItems,
} from '@nordcraft/ssr/dist/rendering/head'
import { getCharset, getHtmlLanguage } from '@nordcraft/ssr/dist/rendering/html'
import {
  get404Page,
  matchPageForUrl,
  matchRouteForUrl,
} from '@nordcraft/ssr/dist/routing/routing'
import { hasCustomCode } from '@nordcraft/ssr/src/custom-code/codeRefs'
import { removeTestData } from '@nordcraft/ssr/src/rendering/testData'
import type { Context } from 'hono'
import { html, raw } from 'hono/html'
import type { HonoEnv } from '../../hono'
import { evaluateComponentApis, RedirectError } from '../utils/api'
import { routeHandler } from './routeHandler'

export const toddlePage = async (c: Context<HonoEnv>) => {
  const project = c.var.project
  const url = new URL(c.req.url)
  // Prefer routes over pages in case of conflicts
  const route = matchRouteForUrl({
    // might not want to use main branch here
    env: serverEnv({ branchName: 'main', req: c.req.raw, logErrors: false }),
    req: c.req.raw,
    routes: project.files.routes,
    serverContext: getServerToddleObject(project.files),
    url,
  })
  if (route) {
    return routeHandler(c, route)
  }
  let page = matchPageForUrl({
    url,
    components: project.files.components,
  })
  if (!page) {
    page = get404Page(project.files.components)
    if (!page) {
      return c.html('Page not found', { status: 404 })
    }
  }
  const formulaContext = getPageFormulaContext({
    component: page,
    branchName: 'main',
    req: c.req.raw,
    logErrors: true,
    files: project.files,
  })
  const language = getHtmlLanguage({
    pageInfo: page.route.info,
    formulaContext,
    defaultLanguage: 'en',
  })

  // Find the theme to use for the page
  const theme =
    (project.files.themes
      ? Object.values(project.files.themes)[0]
      : project.files.config?.theme) ?? defaultTheme

  // Get all included components on the page
  const includedComponents = takeIncludedComponents({
    root: page,
    projectComponents: project.files.components,
    packages: project.files.packages,
    includeRoot: true,
  })

  const toddleComponent = new ToddleComponent<string>({
    component: page,
    getComponent: (name, packageName) => {
      const nodeLookupKey = [packageName, name].filter(isDefined).join('/')
      const component = packageName
        ? project.files.packages?.[packageName]?.components[name]
        : project.files.components[name]
      if (!component) {
        console.warn(`Unable to find component ${nodeLookupKey} in files`)
        return undefined
      }

      return component
    },
    packageName: undefined,
    globalFormulas: {
      formulas: project.files.formulas,
      packages: project.files.packages,
    },
  })
  const head = renderHeadItems({
    headItems: getHeadItems({
      url,
      // This refers to the endpoint we created in fontRouter for our proxied stylesheet
      cssBasePath: '/.toddle/fonts/stylesheet/css2',
      page: toddleComponent,
      files: project.files,
      project: project.project,
      context: formulaContext,
      theme,
    }),
  })
  let body: string
  try {
    body = (
      await renderPageBody({
        component: toddleComponent,
        formulaContext,
        env: formulaContext.env as ToddleServerEnv,
        req: c.req.raw,
        files: project.files,
        includedComponents,
        evaluateComponentApis,
        projectId: 'my_project',
      })
    ).html
  } catch (e) {
    if (e instanceof RedirectError) {
      return new Response(null, {
        status: e.redirect.statusCode ?? 302,
        // Header for helping the client (user) know which API caused the redirect
        headers: {
          'x-toddle-redirect-api-name': e.redirect.apiName,
          'x-toddle-redirect-component-name': e.redirect.componentName,
          location: e.redirect.url.href,
        },
      })
    } else {
      return new Response('Internal server error', { status: 500 })
    }
  }
  const charset = getCharset({
    pageInfo: toddleComponent.route?.info,
    formulaContext,
  })

  // Prepare the data to be passed to the client for hydration
  const toddleInternals: ToddleInternals = {
    project: c.var.project.project.short_id,
    branch: 'main',
    commit: 'unknown',
    pageState: formulaContext.data,
    component: removeTestData(page),
    components: includedComponents.map(removeTestData),
    isPageLoaded: false,
    cookies: Object.keys(formulaContext.env.request.cookies),
  }
  const usesCustomCode = hasCustomCode(toddleComponent, c.var.project.files)
  let codeImport = ''
  if (usesCustomCode) {
    const customCodeSearchParams = new URLSearchParams([
      ['entry', toddleComponent.name],
    ])
    codeImport = `
            <script type="module">
              import { initGlobalObject, createRoot } from '/_static/page.main.esm.js';
              import { loadCustomCode, formulas, actions } from '/.toddle/custom-code.js?${customCodeSearchParams.toString()}';

              window.__toddle = ${JSON.stringify(toddleInternals).replaceAll(
                '</script>',
                '<\\/script>',
              )};
              window.__toddle.components = [window.__toddle.component, ...window.__toddle.components];
              initGlobalObject({formulas, actions});
              loadCustomCode();
              createRoot(document.getElementById("App"));
            </script>
          `
  } else {
    codeImport = `
        <script type="module">
          import { initGlobalObject, createRoot } from '/_static/page.main.esm.js';

          window.__toddle = ${JSON.stringify(toddleInternals).replaceAll(
            '</script>',
            '<\\/script>',
          )};
          window.__toddle.components = [window.__toddle.component, ...window.__toddle.components];
          initGlobalObject({formulas: {}, actions: {}});
          createRoot(document.getElementById("App"));
        </script>
    `
  }

  return c.html(
    html`<!doctype html>
      <html lang="${language}">
        <head>
          ${raw(head)} ${raw(codeImport)}
        </head>
        <body>
          <div id="App">${raw(body)}</div>
        </body>
      </html>`,
    {
      headers: {
        'Content-Type': `text/html; charset=${charset}`,
      },
    },
  )
}
