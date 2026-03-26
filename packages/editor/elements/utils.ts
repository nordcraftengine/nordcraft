import { listAll } from '@webref/elements'
import { api } from 'mdn-data'

// See https://www.npmjs.com/package/@webref/elements?activeTab=code
const htmlElementDefinitions = (await listAll())?.['html']?.elements
const svg1ElementDefinitions = (await listAll())?.['SVG11']?.elements
const svg2ElementDefinitions = (await listAll())?.['SVG2']?.elements
const filterEffectDefinitions = (await listAll())?.['filter-effects-1']
  ?.elements

export const getHtmlElementInterface = (element: string) =>
  element === 'global'
    ? 'global'
    : htmlElementDefinitions?.find((el) => el.name === element)?.interface

export const getSvgElementInterface = (element: string) =>
  element === 'global'
    ? 'global'
    : (svg2ElementDefinitions?.find((el) => el.name === element)?.interface ??
      svg1ElementDefinitions?.find((el) => el.name === element)?.interface ??
      filterEffectDefinitions?.find((el) => el.name === element)?.interface)

export const isSvgInterface = (maybeInterface: string) =>
  svg2ElementDefinitions?.some((el) => el.interface === maybeInterface) ||
  svg1ElementDefinitions?.some((el) => el.interface === maybeInterface) ||
  filterEffectDefinitions?.some((el) => el.interface === maybeInterface)

export const isHtmlInterface = (interfaceName: string) =>
  api.inheritance[interfaceName] !== undefined

export const inheritedInterfaces = (
  _interfaceName: string,
  includeGlobal: boolean,
): string[] => {
  const inheritanceData = api.inheritance[_interfaceName]
  const interfaceName = _interfaceName.replaceAll('SVGSVG', 'SVG')
  if (inheritanceData?.inherits) {
    return [
      interfaceName,
      ...inheritedInterfaces(inheritanceData.inherits, includeGlobal),
    ]
  }
  return [interfaceName, ...(includeGlobal ? ['global'] : [])]
}

const MDN_METADATA_URL = 'https://developer.mozilla.org/en-US/metadata.json'
let mdnMetadata:
  | undefined
  | Array<{
      summary: string
      title: string
      mdn_url: string
      popularity?: number | null
      pageType:
        | 'glossary-definition'
        | 'landing-page'
        | 'unknown'
        | 'guide'
        | 'glossary-disambiguation'
        | 'webassembly-instruction'
        | 'webassembly-interface'
        | 'webassembly-function'
        | 'webassembly-constructor'
        | 'webassembly-instance-property'
        | 'webassembly-instance-method'
        | 'webassembly-static-method'
        | 'webextension-api-function'
        | 'webextension-manifest-key'
        | 'webextension-api'
        | 'webextension-api-property'
        | 'webextension-api-event'
        | 'webextension-api-type'
        | 'firefox-release-notes'
        | 'firefox-release-notes-active'
        | 'http-cors-error'
        | 'http-header'
        | 'http-permissions-policy-directive'
        | 'http-status-code'
        | 'http-method'
        | 'http-csp-directive'
        | 'tutorial'
        | 'tutorial-chapter'
        | 'web-manifest-member'
        | 'how-to'
        | 'html-element'
        | 'webdriver-capability'
        | 'html-attribute-value'
        | 'webdriver-error'
        | 'webdriver-command'
        | 'html-attribute'
        | 'css-module'
        | 'css-at-rule'
        | 'css-at-rule-descriptor'
        | 'css-function'
        | 'css-media-feature'
        | 'javascript-language-feature'
        | 'javascript-instance-data-property'
        | 'javascript-instance-method'
        | 'javascript-error'
        | 'css-pseudo-class'
        | 'css-pseudo-element'
        | 'css-combinator'
        | 'css-selector'
        | 'javascript-constructor'
        | 'javascript-static-data-property'
        | 'javascript-class'
        | 'javascript-instance-accessor-property'
        | 'javascript-static-method'
        | 'javascript-function'
        | 'javascript-static-accessor-property'
        | 'css-shorthand-property'
        | 'css-property'
        | 'javascript-namespace'
        | 'javascript-global-property'
        | 'css-type'
        | 'css-keyword'
        | 'aria-role'
        | 'aria-attribute'
        | 'mathml-element'
        | 'mathml-attribute'
        | 'javascript-statement'
        | 'javascript-operator'
        | 'web-api-interface'
        | 'web-api-instance-property'
        | 'web-api-overview'
        | 'web-api-instance-method'
        | 'web-api-event'
        | 'web-api-constructor'
        | 'web-api-static-property'
        | 'web-api-static-method'
        | 'webgl-extension'
        | 'svg-element'
        | 'svg-attribute'
        | 'webgl-extension-method'
        | 'exslt-function'
        | 'xpath-function'
        | 'xslt-element'
        | 'learn-module'
        | 'learn-module-chapter'
        | 'learn-module-assessment'
        | 'learn-faq'
        | 'learn-topic'
        | 'mdn-writing-guide'
        | 'mdn-community-guide'
    }>

export const initMdnMetadata = async () => {
  mdnMetadata = await fetch(MDN_METADATA_URL).then((res) => res.json())
  mdnMetadata = mdnMetadata!
    .filter(
      (entry) =>
        [
          'html-attribute',
          'svg-attribute',
          'web-api-instance-property',
          'web-api-event',
        ].includes(entry.pageType) &&
        entry.summary.includes('read-only property') === false,
    )
    .map((entry) => ({
      ...entry,
      summary: stripNewlines(entry.summary),
    }))
}

export const getAttributeInfo = ({
  namespace,
  attribute,
  interfaceName,
}: {
  namespace: 'HTML' | 'SVG'
  attribute: string
  interfaceName: string | undefined
}) => {
  if (mdnMetadata === undefined) {
    throw new Error('MDN metadata not initialized')
  }
  // "/en-US/docs/Web/SVG/Reference/Attribute/orient"
  // "/en-US/docs/Web/HTML/Reference/Attributes/max"
  // "/en-US/docs/Web/API/SVGAElement/download"
  const entry = mdnMetadata.find((entry) => {
    if (namespace === 'SVG') {
      return (
        entry.mdn_url.toLocaleLowerCase() ===
        `/en-US/docs/Web/SVG/Reference/Attribute/${attribute}`.toLocaleLowerCase()
      )
    } else if (interfaceName === 'global') {
      return (
        entry.mdn_url.toLocaleLowerCase() ===
        `/en-US/docs/Web/HTML/Reference/Global_attributes/${attribute}`.toLocaleLowerCase()
      )
    }
    return (
      entry.mdn_url.toLocaleLowerCase() ===
      `/en-US/docs/Web/HTML/Reference/Attributes/${attribute}`.toLocaleLowerCase()
    )
  })
  if (entry) {
    return entry
  }
  return mdnMetadata.find(
    (entry) =>
      entry.mdn_url.toLocaleLowerCase() ===
      `/en-US/docs/Web/API/${interfaceName}/${attribute}`.toLocaleLowerCase(),
  )
}

export const getEventInfo = ({
  eventName,
  interfaceName,
}: {
  eventName: string
  interfaceName: string
}) => {
  if (mdnMetadata === undefined) {
    throw new Error('MDN metadata not initialized')
  }
  const entry = mdnMetadata.find(
    (entry) =>
      entry.pageType === 'web-api-event' &&
      entry.mdn_url.toLocaleLowerCase() ===
        `/en-US/docs/Web/API/${interfaceName}/${eventName}_event`.toLocaleLowerCase(),
  )
  return entry
}

/**
 * Sorting utility function that sorts by popularity if available (higher is more popular),
 * otherwise falls back to alphabetical sorting by name.
 */
export const sortByPopularityOrAlphabetical = <
  T extends { popularity?: number; name: string },
>(
  a: T,
  b: T,
) => {
  if (typeof a.popularity === 'number' && typeof b.popularity === 'number') {
    return b.popularity - a.popularity
  }
  // Prefer items with defined popularity
  if (typeof a.popularity === 'number') {
    return -1
  }
  if (typeof b.popularity === 'number') {
    return 1
  }
  // Fallback to alphabetical sorting
  return a.name.localeCompare(b.name)
}

export const stripNewlines = (str: string) => str.replace(/(\r\n|\n|\r)/gm, ' ')
