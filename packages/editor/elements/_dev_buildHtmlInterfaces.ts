import { listAll as listAllEvents } from '@webref/events'
import { writeFileSync } from 'fs'
import { getHtmlElementInterface, isHtmlInterface } from './utils'

// Fetches HTML attributes from the webref repository and generates a JSON file
// mapping HTML interfaces to their attributes.
// The file is saved as ./interfaces/htmlInterfaceAttributes.json

interface HtmlDefinition {
  id: string
  href: string
  linkingText: string[]
  localLinkingText: string[]
  type: 'attribute' | 'element-attr' | 'dfn' | 'attr-value' // We only care about attributes, element-attr, and attr-value
  for: string[]
  access: 'public' | 'private' // Not relevant
  informative: boolean // Not relevant
  heading: any // Not relevant
  definedIn: string // Not relevant
  links: [] // Not relevant
}

interface HtmlAttributeDefinition {
  name: string
  options?: string[]
}

interface HtmlInterfaceDefinition {
  attributes?: Array<HtmlAttributeDefinition>
  events?: string[]
}

interface ReferrerPolicyValue {
  id: string
  href: string
  linkingText: string[]
  localLinkingText: string[]
  type: 'enum-value' | string // enum-value is the relevant type
  for: string[] // We're only interested in those that are for 'ReferrerPolicy'
  access: 'public' | 'private' // Not relevant
  informative: boolean // Not relevant
  heading: any // Not relevant
  definedIn: string // Not relevant
  links: [] // Not relevant
}

const EXCLUDED_ATTRIBUTE_NAMES = new Set(['innerHTML', 'outerHTML'])

const REFERRER_POLICIES_URL =
  'https://raw.githubusercontent.com/w3c/webref/refs/heads/main/tr/dfns/referrer-policy.json'
const HTML_DEFINITIONS_URL =
  'https://raw.githubusercontent.com/w3c/webref/refs/heads/main/ed/dfns/html.json'

const mapInterfaceName = (name?: string) => {
  const interfaceMapping: Partial<Record<string, string>> = {
    'html-global': 'global',
  }
  return typeof name === 'string' ? (interfaceMapping[name] ?? name) : name
}

// Fetch HTML definitions from the webref repository
const definitions: {
  spec: { title: string; url: string }
  dfns: HtmlDefinition[]
} = await fetch(HTML_DEFINITIONS_URL).then((res) => res.json())
// Find all elements that have the 'referrerpolicy' attribute
const elementsWithReferrerPolicyAttr = definitions.dfns
  .filter(
    (d) => d.type === 'element-attr' && d.linkingText[0] === 'referrerpolicy',
  )
  .reduce((acc, d) => new Set([...acc, ...d.for]), new Set<string>())
// Fetch referrer-policy definitions and add 'referrerpolicy' attribute options manually to definitions
const referrerPolicies: {
  spec: { title: string; url: string }
  dfns: ReferrerPolicyValue[]
} = await fetch(REFERRER_POLICIES_URL).then((res) => res.json())
referrerPolicies.dfns
  .filter((d) => d.type === 'enum-value' && d.for.includes('ReferrerPolicy'))
  .forEach((d) => {
    const linkingText = d.linkingText.filter(
      (lt) => !lt.startsWith('"') && lt.length > 0,
    ) // Remove any quoted or empty values
    if (linkingText.length === 0) {
      return
    }
    definitions.dfns.push({
      ...d,
      type: 'attr-value',
      linkingText,
      for: Array.from(elementsWithReferrerPolicyAttr).map(
        (el) => `${el}/referrerpolicy`,
      ),
    })
  })
// Inject all commonly used og:* attribute options
// See https://ogp.me/ for reference
// While og:* attributes are not standard HTML attributes, they are widely used
// in meta tags for social media integration. We're not including platform-specific
// attributes atm (like Twitter Cards) to keep the list focused.
const ogProperties = [
  'og:title',
  'og:type',
  'og:url',
  'og:description',
  'og:site_name',
  'og:locale',
  'og:locale:alternate',
  'og:determiner',
  'og:image',
  'og:image:url',
  'og:image:secure_url',
  'og:image:type',
  'og:image:width',
  'og:image:height',
  'og:image:alt',
  'og:video',
  'og:video',
  'og:video:secure_url',
  'og:video:type',
  'og:video:width',
  'og:video:height',
  'og:audio',
  'og:audio',
  'og:audio:secure_url',
  'og:audio:type',
]
ogProperties.forEach((property) => {
  definitions.dfns.push({
    id: `og-property-${property}`,
    href: 'https://ogp.me/',
    linkingText: [property],
    localLinkingText: [property],
    type: 'attr-value',
    for: ['meta/property'],
    access: 'public',
    informative: true,
    heading: null,
    definedIn: 'Open Graph Protocol',
    links: [],
  })
})

// Group attributes by their interfaces
const groupedAttributes = definitions.dfns
  .filter(
    // Make Typescript aware that linkingText[0] exists if the filter is truthy
    (d): d is HtmlDefinition & { linkingText: [string, ...string[]] } => {
      const attrName = d.linkingText[0]
      return (
        // Ignore all event attributes
        (!d.id.startsWith('handler-') &&
          d.linkingText.length > 0 &&
          typeof attrName === 'string' &&
          // Only include relevant attributes
          !EXCLUDED_ATTRIBUTE_NAMES.has(attrName) &&
          // Skip internal attributes
          !(attrName.startsWith('[[') && attrName.endsWith(']]')) &&
          // Only keep relevant attributes
          d.type === 'attribute') ||
        // Keep all element-attr definitions
        d.type === 'element-attr'
      )
    },
  )
  .reduce(
    (acc, d) => {
      const attrName = d.linkingText[0]
      const interfaceNames = d.for
      interfaceNames.forEach((_interfaceName) => {
        const mappedInterfaceName = mapInterfaceName(_interfaceName)
        if (typeof mappedInterfaceName !== 'string') {
          return acc
        }
        if (isHtmlInterface(mappedInterfaceName)) {
          // Attibutes declared directly on HTML interfaces are skipped
          // as they are sometimes properties rather than attributes
          // All attributes should be included directly from elements
          return acc
        }
        const interfaceName = getHtmlElementInterface(mappedInterfaceName)
        if (typeof interfaceName === 'string') {
          acc[interfaceName] ??= {}
          // The 'href' attribute is currently missing in the webref data for the HTMLAnchorElement interface
          // So we add it manually here
          acc[interfaceName].attributes ??=
            interfaceName === 'HTMLAnchorElement' ? [{ name: 'href' }] : []
          if (
            !acc[interfaceName].attributes.find(
              (attr) =>
                attr.name.toLocaleLowerCase() === attrName.toLocaleLowerCase(),
            )
          ) {
            acc[interfaceName].attributes.push({ name: attrName })
          }
        } else {
          // eslint-disable-next-line no-console
          console.warn('Skipping invalid interface name:', mappedInterfaceName)
        }
      })
      return acc
    },
    {} as Partial<Record<string, HtmlInterfaceDefinition>>,
  )

// Fill up suggested options for relevant attributes
definitions.dfns
  .filter((d) => d.type === 'attr-value')
  .forEach((d) => {
    d.for.forEach((forLink) => {
      const parts = forLink.split('/')
      const elementPart = parts.at(0)
      const attributePart = parts.at(1)
      const value = d.linkingText[0]
      if (elementPart && attributePart && typeof value === 'string') {
        const mappedElement = mapInterfaceName(elementPart)
        if (!mappedElement) {
          // eslint-disable-next-line no-console
          console.warn(`No mapping for element part: ${elementPart}`)
          return
        }
        const interfaceName = getHtmlElementInterface(mappedElement)
        if (!interfaceName) {
          // eslint-disable-next-line no-console
          console.warn(`No interface for element: ${mappedElement}`)
          return
        }
        let interfaceItem = groupedAttributes[interfaceName]
        if (!interfaceItem) {
          // Create the missing interface entry
          interfaceItem = { attributes: [{ name: attributePart }] }
          groupedAttributes[interfaceName] = interfaceItem
        }
        const attributeItem = interfaceItem.attributes?.find(
          (attr) =>
            attr.name.toLocaleLowerCase() === attributePart.toLocaleLowerCase(),
        )
        if (attributeItem) {
          const options = attributeItem.options ?? []
          if (!options.includes(value)) {
            options.push(value)
          }
          attributeItem.options = options
        } else {
          // Create the missing attribute entry
          interfaceItem.attributes ??= []
          interfaceItem.attributes.push({
            name: attributePart,
            options: [value],
          })
        }
      } else {
        // eslint-disable-next-line no-console
        console.warn('Skipping invalid forLink:', forLink, d)
      }
    })
  })

// Add events
const events = await listAllEvents()
events.forEach((e) => {
  e.targets.forEach((et) => {
    let interfaceItem = groupedAttributes[et.target]
    if (!interfaceItem) {
      interfaceItem = { events: [] }
      groupedAttributes[et.target] = interfaceItem
    }
    interfaceItem.events ??= []
    interfaceItem.events.push(e.type)
  })
})

// Sort all interfaces and write to file
writeFileSync(
  `./interfaces/htmlInterfaces.json`,
  JSON.stringify(
    Object.entries(groupedAttributes)
      .toSorted(([a], [b]) => a.localeCompare(b))
      // To help Typescript narrow the type
      .filter(
        (args): args is [string, HtmlInterfaceDefinition] =>
          args[1] !== undefined,
      )
      .reduce<Array<HtmlInterfaceDefinition & { name: string }>>(
        (acc, [interfaceName, data]) => [
          ...acc,
          {
            name: interfaceName,
            attributes: data.attributes?.toSorted((a, b) =>
              a.name.localeCompare(b.name),
            ),
            events: data.events?.toSorted(),
          },
        ],
        [],
      ),
    null,
    2,
  ),
  'utf-8',
)
