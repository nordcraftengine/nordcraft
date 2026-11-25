import type { PageComponent, PageStateData } from '@nordcraft/core'
import {
  applyFormula,
  DATA_ATTR_COMPONENTS_URL,
  DATA_ATTR_CUSTOM_CODE_URL,
  theme as defaultTheme,
  PAGE_STATE_SCRIPT_ID,
  THEME_DATA_ATTRIBUTE,
  toBoolean,
} from '@nordcraft/core'
import type {
  ApiCache,
  ProjectFilesWithCustomCode,
  SsrFormulaHandler,
  ToddleProject,
} from '@nordcraft/ssr'
import {
  escapeAttrValue,
  evaluateResponseHeaders,
  getCharset,
  getHeadItems,
  getHtmlLanguage,
  getPageFormulaContext,
  getTheme,
  processComponentApis,
  REDIRECT_API_NAME_HEADER,
  REDIRECT_COMPONENT_NAME_HEADER,
  renderHeadItems,
  renderPageBody,
  takeIncludedComponents,
  urlWithCacheBuster,
} from '@nordcraft/ssr'
import type { Context } from 'hono'
import { endTime, startTime } from 'hono/timing'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { HonoEnv } from '../../hono'
import type { PageLoaderUrls } from '../loaders/types'
import { evaluateComponentApis, RedirectError } from '../utils/api'

export const nordcraftPage = async ({
  hono,
  project,
  files,
  page: _page,
  status,
  options,
  cacheBuster,
}: {
  hono: Context<HonoEnv<any>>
  project: ToddleProject
  files: ProjectFilesWithCustomCode<SsrFormulaHandler>
  page: PageComponent
  status: ContentfulStatusCode
  options: PageLoaderUrls
  cacheBuster?: string
}) => {
  const usesCustomCode = files.customCode
  const nordcraftPageTimingKey = 'nordcraftPage'
  startTime(hono, nordcraftPageTimingKey, 'The total render time for a page')
  const url = new URL(hono.req.raw.url)
  const page = processComponentApis(_page, files)
  const { formulaContext, data } = getPageFormulaContext({
    component: page,
    branchName: 'main',
    req: hono.req.raw,
    logErrors: true,
    files,
  })
  const language = getHtmlLanguage({
    pageInfo: page.route.info,
    formulaContext,
    data,
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
  }).map((component) => processComponentApis(component, files))

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
      component: page,
      formulaContext,
      data,
      env: formulaContext.env,
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

  let head = renderHeadItems({
    headItems: getHeadItems({
      url,
      cacheBuster,
      // This refers to the endpoint we created in fontRouter for our proxied stylesheet
      cssBasePath: '/.toddle/fonts/stylesheet/css2',
      // Just to be explicit about where to grab the reset stylesheet from
      resetStylesheetPath: '/_static/reset.css',
      // This refers to the generated stylesheet for each page
      pageStylesheetPath: options.pageStylesheetUrl(page.name),
      page,
      files: files,
      project,
      context: formulaContext,
      data,
      themes,
      customProperties,
    }),
  })
  const charset = getCharset({
    pageInfo: page.route?.info,
    formulaContext,
    data,
  })

  // Prepare the dynamic per-request state to be serialized in the document for hydration
  const serializablePageState: PageStateData = {
    pageState: {
      ...data,
      Apis: {
        ...apiCache,
      },
    },
    cookies: Object.keys(formulaContext.env.request.cookies),
  }
  endTime(hono, nordcraftPageTimingKey)

  const htmlAttributes = Object.entries({
    [THEME_DATA_ATTRIBUTE]: getTheme({
      pageInfo: page.route.info,
      formulaContext,
      data,
    }),
  })
    .filter(([, value]) => toBoolean(value))
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ')

  const componentsUrl = urlWithCacheBuster(
    options.pageComponentsUrl?.(page.name) ??
      `/_static/components_${page.name}.json`,
    cacheBuster,
  )
  const customCodeUrl = usesCustomCode
    ? urlWithCacheBuster(options.customCodeUrl(page.name), cacheBuster)
    : undefined
  const stateAttributes = [
    `type="application/json"`,
    `id="${PAGE_STATE_SCRIPT_ID}"`,
    `${DATA_ATTR_COMPONENTS_URL}="${escapeAttrValue(componentsUrl)}"`,
    ...(typeof customCodeUrl === 'string'
      ? [`${DATA_ATTR_CUSTOM_CODE_URL}="${escapeAttrValue(customCodeUrl)}"`]
      : []),
  ].join(' ')
  const headPreloads = [
    // Tell the browser to start fetching the cached component structures as early as possible
    `<link rel="preload" as="fetch" crossorigin="anonymous" href="${escapeAttrValue(componentsUrl)}" />`,
    // Tell the browser to start fetching the runtime as early as possible
    `<link rel="modulepreload" href="/_static/page.main.esm.js" />`,
    ...(typeof customCodeUrl === 'string'
      ? // Tell the browser to start fetching custom code for the page as early as possible (if needed)
        [
          `<link rel="modulepreload" href="${escapeAttrValue(customCodeUrl)}" />`,
        ]
      : []),
  ]
  head = `${head}\n${headPreloads.join('\n')}`

  const responseHeaders = evaluateResponseHeaders({
    formulaContext,
    data,
    responseHeaders: page.route.response?.headers,
  })

  const customStatusCode = applyFormula(
    page.route.response?.status,
    formulaContext,
    data,
  )
  const statusCode =
    typeof customStatusCode === 'number'
      ? (customStatusCode as any as ContentfulStatusCode)
      : status

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(
        encoder.encode(
          `<!doctype html><html lang="${language}" ${htmlAttributes}><head>${head}</head><body><div id="App">${body}</div>`,
        ),
      )
      // Yield so the first chunk can be flushed to the client before serializing state
      await Promise.resolve()
      const serializedState = JSON.stringify(serializablePageState).replace(
        /</g,
        '\\u003c',
      )
      const bodyScripts = [
        `<script ${stateAttributes}>${serializedState}</script>`,
        `<script type="module" src="/_static/page.main.esm.js"></script>`,
      ]
      controller.enqueue(
        encoder.encode(`${bodyScripts.join('\n')}</body></html>`),
      )
      controller.close()
    },
  })

  return new Response(stream, {
    status: statusCode,
    headers: {
      'Content-Type': `text/html; charset=${charset}`,
      ...responseHeaders,
    },
  })
}
