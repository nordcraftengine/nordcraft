import type { Component } from '@nordcraft/core/dist/component/component.types'
import { HeadTagTypes } from '@nordcraft/core/dist/component/component.types'
import type { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import type { FormulaContext } from '@nordcraft/core/dist/formula/formula'
import { applyFormula } from '@nordcraft/core/dist/formula/formula'
import type { OldTheme, Theme } from '@nordcraft/core/dist/styling/theme'
import { CUSTOM_PROPERTIES_STYLESHEET_ID } from '@nordcraft/core/dist/styling/theme.const'
import { easySort } from '@nordcraft/core/dist/utils/collections'
import { validateUrl } from '@nordcraft/core/dist/utils/url'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import { VOID_HTML_ELEMENTS } from '../const'
import { escapeAttrValue } from '../rendering/attributes'
import type { ProjectFiles, ToddleProject } from '../ssr.types'
import { isCloudflareImagePath } from '../utils/media'
import { nanoid } from '../utils/nanoid'
import { getFontCssUrl } from './fonts'
import { getCharset } from './html'
import { defaultSpeculationRules } from './speculation'

type Text = string
export type HeadItemType = `${HeadTagTypes}:${Text}` | 'title'

/**
 * Returns all head items for a given page
 */
export const getHeadItems = ({
  cacheBuster,
  context,
  cssBasePath = '/.toddle/fonts/stylesheet/css2',
  page,
  resetStylesheetPath = '/_static/reset.css',
  pageStylesheetPath = `/.toddle/stylesheet/${page.name}.css`,
  files,
  project,
  theme,
  url,
  customProperties,
}: {
  // Optional cache buster for reset stylesheet + manifest url. Could be a commit sha for instance
  cacheBuster?: string
  context: FormulaContext
  cssBasePath?: string
  files: ProjectFiles
  page: ToddleComponent<string>
  resetStylesheetPath?: string
  pageStylesheetPath?: string
  project: ToddleProject
  theme: OldTheme | Theme
  url: URL
  customProperties: ReadonlyArray<string>
}): Map<HeadItemType, string> => {
  const pageInfo = page.route?.info
  const title = getPageTitle({
    component: page,
    context,
    defaultTitle: project.name,
  })
  const description = getPageDescription({
    component: page,
    context,
    defaultDescription: project.description,
  })

  const preloadFonts: [HeadItemType, string][] = []
  if ('breakpoints' in theme === false) {
    // We include all fonts even though it's not necessary.
    // While this is not the ideal long-term solution, it does have a few benefits:
    // - It's easier to cache the font stylesheet across pages
    // - It simplifies style variable setup in theme.ts
    // - It ensures the same behaviour as in our editor
    // - It increases the chance that there's a font to be used by our
    //   reset stylesheet (font-family: var(--font-sans))
    // For most apps, the overhead of including all fonts is negligible and
    // it doesn't add a lot of bytes to our stylesheet.

    // Add link to stylesheet that includes the different font-faces
    if (theme.fonts.length > 0) {
      const fontStylesheetUrl = getFontCssUrl({
        fonts: theme.fonts,
        basePath: cssBasePath,
      })
      if (fontStylesheetUrl) {
        preloadFonts.push([
          // Later we'll support multiple font loading strategies aside from swap
          'link:font:swap',
          // See https://fonts.google.com/selection/embed
          `<link href="${escapeAttrValue(fontStylesheetUrl.swap.toString())}" rel="stylesheet" />`,
        ])
      }
    }
  }

  const charset = getCharset({ pageInfo, formulaContext: context })
  const descriptionItems: [HeadItemType, string][] = []
  if (typeof description === 'string') {
    // Only add meta:description and og:description if a description exists
    descriptionItems.push([
      'meta:description',
      `<meta name="description" content="${escapeAttrValue(description)}" />`,
    ])
    descriptionItems.push([
      'meta:og:description',
      `<meta property="og:description" content="${escapeAttrValue(
        description,
      )}" />`,
    ])
  }
  const headItems = new Map<HeadItemType, string>([
    [
      'link:reset',
      `<link rel="stylesheet" fetchpriority="high" href="${escapeAttrValue(urlWithCacheBuster(resetStylesheetPath, cacheBuster))}" />`,
    ],
    [
      'link:page',
      `<link rel="stylesheet" fetchpriority="high" href="${escapeAttrValue(urlWithCacheBuster(pageStylesheetPath, cacheBuster))}" />`,
    ],
    [
      'style:variables',
      `<style id="${CUSTOM_PROPERTIES_STYLESHEET_ID}">${customProperties.join('\n')}</style>`,
    ],
    ...preloadFonts,
    // Initialize default head items (meta + links)
    // these might be overwritten by custom tags later
    ['meta:charset', `<meta charset="${escapeAttrValue(charset)}" />`],
    [
      'meta:viewport',
      `<meta name="viewport" content="width=device-width, initial-scale=1" />`,
    ],
    // Title + og:title + apple-mobile-web-app-title
    ['title', `<title>${title}</title>`],
    [
      'meta:og:title',
      `<meta property="og:title" content="${escapeAttrValue(title)}" />`,
    ],
    [
      'meta:apple-mobile-web-app-title',
      `<meta name="apple-mobile-web-app-title" content="${escapeAttrValue(
        title,
      )}">`,
    ],
    // Description + og:description
    ...descriptionItems,
    ['meta:og:type', `<meta property="og:type" content="website" />`],
    [
      'meta:og:url',
      `<meta property="og:url" content="${escapeAttrValue(url.href)}" />`,
    ],
    [
      'meta:application-name',
      `<meta name="application-name" content="${escapeAttrValue(
        project.name,
      )}">`,
    ],
    [
      'script:speculationrules',
      `<script type="speculationrules">${JSON.stringify(
        defaultSpeculationRules,
      )}</script>`,
    ],
  ])
  if (project.type === 'package' && project.thumbnail) {
    // Packages usually have a thumbnail set. In case the user picked a custom og:image,
    // the thumbnail will be overwritten by the user's og:image
    const thumbnailUrl = isCloudflareImagePath(project.thumbnail.path)
      ? `${url.origin}${project.thumbnail.path}/256`
      : project.thumbnail.path
    headItems.set(
      'meta:og:image',
      `<meta property="og:image" content="${escapeAttrValue(
        `${thumbnailUrl}`,
      )}" />`,
    )
  }
  const manifestUrl = validateUrl({
    path: applyFormula(files.config?.meta?.manifest?.formula, context),
    origin: url.origin,
  })
  if (manifestUrl) {
    const manifestUrl = urlWithCacheBuster('/manifest.json', cacheBuster)
    headItems.set(
      'link:manifest',
      `<link rel="manifest" href="${escapeAttrValue(manifestUrl)}">`,
    )
  } else {
    // Only add a default theme-color + msapplication-TileColor if there is no manifest declared
    headItems.set(
      'meta:theme-color',
      '<meta name="theme-color" content="#171717">',
    )
    headItems.set(
      'meta:msapplication-tilecolor',
      '<meta name="msapplication-TileColor" content="#171717">',
    )
  }

  const hasCustomMeta = (nameOrProperty: string) =>
    Object.values(pageInfo?.meta ?? {}).some((m) =>
      Object.entries(m.attrs ?? {}).some(
        ([k, value]) =>
          ['name', 'property'].includes(k.toLowerCase()) &&
          value.type === 'value' &&
          typeof value.value === 'string' &&
          value.value.toLowerCase() === nameOrProperty.toLowerCase(),
      ),
    )
  const icon = files.config?.meta?.icon
  if (isDefined(icon)) {
    const iconPath = applyFormula(icon.formula, context)
    if (isDefined(iconPath) && typeof iconPath === 'string') {
      if (isCloudflareImagePath(iconPath)) {
        // If the icon is a cloudflare image path, we add the different sizes
        const basePath = iconPath.split('/').slice(0, -1).join('/')
        headItems.set(
          'link:icon:16',
          `<link rel="icon" sizes="16x16" href="${escapeAttrValue(
            `${basePath}/16`,
          )}" />`,
        )
        headItems.set(
          'link:icon:32',
          `<link rel="icon" sizes="32x32" href="${escapeAttrValue(
            `${basePath}/32`,
          )}" />`,
        )
        headItems.set(
          'link:icon',
          `<link rel="shortcut icon" href="${escapeAttrValue(
            `${basePath}/48`,
          )}" />`,
        )
      } else {
        headItems.set(
          'link:icon',
          `<link rel="icon" href="${escapeAttrValue(iconPath)}" />`,
        )
      }
    }
  } else if (
    // Only add default icons if no icon is set
    ![
      'link:icon',
      'link:mask-icon',
      'link:apple-touch-icon',
      'link:icon:16',
      'link:icon:32',
    ].every((k) => !hasCustomMeta(k))
  ) {
    if (project.emoji) {
      // Use emoji as icon
      headItems.set(
        'link:icon',
        `<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${escapeAttrValue(
          project.emoji,
        )}</text></svg>">`,
      )
    }
    headItems.set(
      'link:mask-icon',
      '<link rel="mask-icon" href="https://raw.githubusercontent.com/toddledev/resources/main/icons/safari-pinned-tab.svg" color="#171717">',
    )
    headItems.set(
      'link:apple-touch-icon',
      '<link rel="apple-touch-icon" sizes="180x180" href="https://raw.githubusercontent.com/toddledev/resources/main/icons/apple-touch-icon.png">',
    )
    headItems.set(
      'link:icon:16',
      '<link rel="icon" type="image/png" sizes="16x16" href="https://raw.githubusercontent.com/toddledev/resources/main/icons/favicon-16x16.png">',
    )
    headItems.set(
      'link:icon:32',
      '<link rel="icon" type="image/png" sizes="32x32" href="https://raw.githubusercontent.com/toddledev/resources/main/icons/favicon-32x32.png">',
    )
  }
  // Handle custom meta tags last to allow overriding defaults
  if (pageInfo?.meta) {
    easySort(
      Object.entries(pageInfo.meta),
      // Sort by index if it exists
      ([_, meta]) => meta.index ?? Infinity,
    ).forEach(([id, metaEntry]) => {
      if (Object.values(HeadTagTypes).includes(metaEntry.tag)) {
        // If the tag has a name or property attribute, we use that as the key
        // to avoid duplicates and to ensure sorting of tags later
        const key = Object.entries(metaEntry.attrs ?? {}).find(
          ([key]) => key === 'name' || key === 'property',
        )
        const headItemKey: HeadItemType = `${metaEntry.tag}:${
          isDefined(key) ? applyFormula(key[1], context) : (id ?? nanoid())
        }`
        headItems.set(
          headItemKey,
          // Add the id to the tag so it's easier to dynamically update it later
          // from our runtime (main.ts)
          `<${metaEntry.tag} data-toddle-id="${id}" ${Object.entries(
            metaEntry.attrs ?? {},
          )
            .map(([key, formula]) => {
              const value = applyFormula(formula, context)
              if (value === true) {
                // If the value is true, we just return the key - this is useful
                // for tags like <script async> where async doesn't have a value
                return key
              }
              return `${key}="${escapeAttrValue(value)}"`
            })
            .join(' ')} ${
            VOID_HTML_ELEMENTS.includes(metaEntry.tag)
              ? `/>`
              : `>${
                  metaEntry.content
                    ? applyFormula(metaEntry.content, context)
                    : ''
                }</${metaEntry.tag}>`
          }`,
        )
      }
    })
  }
  return headItems
}

export const renderHeadItems = ({
  headItems,
  ordering = defaultHeadOrdering,
}: {
  headItems: Map<string, string>
  ordering?: string[]
}) =>
  easySort([...headItems.entries()], ([key]) => {
    const index = ordering.indexOf(key)
    return index === -1 ? ordering.length : index
  })
    .map(([_, value]) => value)
    .join('\n    ')

// It's difficult to find a "best practice" for ordering head tags, and it's unclear if it matters much
// for crawlers/browsers. We're using a simple ordering that puts (what we believe is) the most relevant
// tags first.
export const defaultHeadOrdering: HeadItemType[] = [
  'meta:charset',
  'meta:viewport',
  'title',
  'meta:description',
  'link:icon:16',
  'link:icon:32',
  'link:icon',
  'meta:og:title',
  'meta:application-name',
  'meta:og:url',
  'meta:og:description',
  'meta:og:type',
  'link:manifest',
  'link:mask-icon',
  'link:apple-touch-icon',
  'meta:theme-color',
  'meta:apple-mobile-web-app-title',
  'meta:msapplication-tilecolor',
  'meta:og:locale',
  // The stylesheets should be loaded asap to avoid any flickering
  'link:reset',
  'link:page',
  // Everything else comes after these predefined tags
]

const getPageTitle = ({
  component,
  context,
  defaultTitle,
}: {
  component: Component
  context: FormulaContext
  defaultTitle?: string
}) => {
  const pageInfo = component.route?.info
  const fallbackTitle = defaultTitle ?? component.name
  if (!isDefined(pageInfo?.title)) {
    return fallbackTitle
  }
  const title = applyFormula(pageInfo.title.formula, context)
  return typeof title === 'string' ? title : fallbackTitle
}

const getPageDescription = ({
  component,
  context,
  defaultDescription,
}: {
  component: Component
  context: FormulaContext
  defaultDescription?: string | null
}) => {
  const pageInfo = component.route?.info
  if (!isDefined(pageInfo?.description)) {
    return defaultDescription
  }
  const description = applyFormula(pageInfo.description.formula, context)
  return typeof description === 'string' ? description : defaultDescription
}

const urlWithCacheBuster = (url: string, cacheBuster?: string) =>
  typeof cacheBuster === 'string'
    ? `${url}?${new URLSearchParams([['v', cacheBuster]]).toString()}`
    : url
