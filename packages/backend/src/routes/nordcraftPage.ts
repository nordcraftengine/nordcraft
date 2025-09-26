import type { PageComponent } from '@nordcraft/core/dist/component/component.types'
import { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import { type ToddleServerEnv } from '@nordcraft/core/dist/formula/formula'
import { theme as defaultTheme } from '@nordcraft/core/dist/styling/theme.const'
import type { ToddleInternals } from '@nordcraft/core/dist/types'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import { takeIncludedComponents } from '@nordcraft/ssr/dist/components/utils'
import type { ApiCache } from '@nordcraft/ssr/dist/rendering/api'
import { renderPageBody } from '@nordcraft/ssr/dist/rendering/components'
import { getPageFormulaContext } from '@nordcraft/ssr/dist/rendering/formulaContext'
import {
  getHeadItems,
  renderHeadItems,
} from '@nordcraft/ssr/dist/rendering/head'
import { getCharset, getHtmlLanguage } from '@nordcraft/ssr/dist/rendering/html'
import type { ProjectFiles, ToddleProject } from '@nordcraft/ssr/dist/ssr.types'
import { removeTestData } from '@nordcraft/ssr/src/rendering/testData'
import {
  REDIRECT_API_NAME_HEADER,
  REDIRECT_COMPONENT_NAME_HEADER,
} from '@nordcraft/ssr/src/utils/headers'
import type { Context } from 'hono'
import { html, raw } from 'hono/html'
import { endTime, startTime } from 'hono/timing'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { HonoEnv } from '../../hono'
import type { PageLoaderUrls } from '../loaders/types'
import { evaluateComponentApis, RedirectError } from '../utils/api'

export const nordcraftPage = async ({
  hono,
  project,
  files,
  page,
  status,
  options,
}: {
  hono: Context<HonoEnv<any>>
  project: ToddleProject
  files: ProjectFiles & { customCode: boolean }
  page: PageComponent
  status: ContentfulStatusCode
  options: PageLoaderUrls
}) => {
  const nordcraftPageTimingKey = 'nordcraftPage'
  startTime(hono, nordcraftPageTimingKey, 'The total render time for a page')
  const url = new URL(hono.req.raw.url)
  const formulaContext = getPageFormulaContext({
    component: page,
    branchName: 'main',
    req: hono.req.raw,
    logErrors: true,
    files,
  })
  const language = getHtmlLanguage({
    pageInfo: page.route.info,
    formulaContext,
    defaultLanguage: 'en',
  })

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

  const toddleComponent = new ToddleComponent<string>({
    component: page,
    getComponent: (name, packageName) => {
      const nodeLookupKey = [packageName, name].filter(isDefined).join('/')
      const component = packageName
        ? files.packages?.[packageName]?.components[name]
        : files.components[name]
      if (!component) {
        // eslint-disable-next-line no-console
        console.warn(`Unable to find component ${nodeLookupKey} in files`)
        return undefined
      }

      return component
    },
    packageName: undefined,
    globalFormulas: {
      formulas: files.formulas,
      packages: files.packages,
    },
  })

  let apiCache: ApiCache
  let body: string
  let customProperties: string[] = []
  try {
    startTime(
      hono,
      'renderPageBody',
      'The time taken to render the page body - including API calls',
    )
    const pageBody = await renderPageBody({
      component: toddleComponent,
      formulaContext,
      env: formulaContext.env as ToddleServerEnv,
      req: hono.req.raw,
      files: files,
      includedComponents,
      evaluateComponentApis,
      projectId: 'my_project',
    })
    endTime(hono, 'renderPageBody')
    apiCache = pageBody.apiCache
    body = pageBody.html
    customProperties = pageBody.customProperties
  } catch (e) {
    if (e instanceof RedirectError) {
      hono.header(REDIRECT_API_NAME_HEADER, e.redirect.apiName)
      hono.header(REDIRECT_COMPONENT_NAME_HEADER, e.redirect.componentName)
      return hono.redirect(e.redirect.url.href, e.redirect.statusCode ?? 302)
    } else {
      return hono.text('Internal server error', 500)
    }
  }

  const head = renderHeadItems({
    headItems: getHeadItems({
      url,
      // This refers to the endpoint we created in fontRouter for our proxied stylesheet
      cssBasePath: '/.toddle/fonts/stylesheet/css2',
      // Just to be explicit about where to grab the reset stylesheet from
      resetStylesheetPath: '/_static/reset.css',
      // This refers to the generated stylesheet for each page
      pageStylesheetPath: options.pageStylesheetUrl(page.name),
      page: toddleComponent,
      files: files,
      project,
      context: formulaContext,
      themes,
      customProperties,
    }),
  })
  const charset = getCharset({
    pageInfo: toddleComponent.route?.info,
    formulaContext,
  })

  // Prepare the data to be passed to the client for hydration
  const toddleInternals: ToddleInternals = {
    project: project.short_id,
    branch: 'main',
    commit: 'unknown',
    pageState: {
      ...formulaContext.data,
      Apis: {
        ...apiCache,
      },
    },
    component: removeTestData(page),
    components: includedComponents.map(removeTestData),
    isPageLoaded: false,
    cookies: Object.keys(formulaContext.env.request.cookies),
  }
  let codeImport = ''
  if (files.customCode) {
    codeImport = `
            <script type="application/json" id="nordcraft-data">
              ${JSON.stringify(toddleInternals).replaceAll(
                '</script>',
                '<\\/script>',
              )}
            </script>
            <script type="module">
              import { initGlobalObject, createRoot } from '/_static/page.main.esm.js';
              import { loadCustomCode, formulas, actions } from '${options.customCodeUrl(toddleComponent.name)}'
              window.__toddle = JSON.parse(document.getElementById('nordcraft-data').textContent);
              window.__toddle.components = [window.__toddle.component, ...window.__toddle.components];
              initGlobalObject({formulas, actions});
              loadCustomCode();
              createRoot(document.getElementById("App"));
            </script>
          `
  } else {
    codeImport = `
        <script type="application/json" id="nordcraft-data">
          ${JSON.stringify(toddleInternals).replaceAll(
            '</script>',
            '<\\/script>',
          )}
        </script>
        <script type="module">
          import { initGlobalObject, createRoot } from '/_static/page.main.esm.js';

          window.__toddle = JSON.parse(document.getElementById('nordcraft-data').textContent);
          window.__toddle.components = [window.__toddle.component, ...window.__toddle.components];
          initGlobalObject({formulas: {}, actions: {}});
          createRoot(document.getElementById("App"));
        </script>
    `
  }
  endTime(hono, nordcraftPageTimingKey)

  return hono.html(
    html`<!doctype html>
      <html lang="${language}">
        <head>
          ${raw(head)}
        </head>
        <body>
          <div id="App">${raw(body)}</div>
          ${raw(codeImport)}
        </body>
      </html>`,
    status,
    {
      'Content-Type': `text/html; charset=${charset}`,
    },
  )
}
