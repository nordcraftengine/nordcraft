import { listAll as listAllEvents } from '@webref/events'
import {
  getAttributeInfo,
  getEventInfo,
  getHtmlElementInterface,
  inheritedInterfaces,
  initMdnMetadata,
  isHtmlInterface,
  sortByPopularityOrAlphabetical,
} from './utils'

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
  description?: string
  options?: string[]
  popularity?: number
  url?: string
}

interface HtmlEventDefinition {
  name: string
  description?: string
  popularity?: number
  url?: string
}

interface HtmlInterfaceDefinition {
  attributes?: Array<HtmlAttributeDefinition>
  events?: Array<HtmlEventDefinition>
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

export const getHtmlInterfaces = async () => {
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

  // Initialize additional MDN metadata
  await initMdnMetadata()

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
            const attributeInfo = getAttributeInfo({
              namespace: 'HTML',
              attribute: attrName,
              interfaceName,
            })
            acc[interfaceName] ??= {}
            // The 'href' attribute is currently missing in the webref data for the HTMLAnchorElement interface
            // So we add it manually here
            acc[interfaceName].attributes ??=
              interfaceName === 'HTMLAnchorElement'
                ? [
                    {
                      name: 'href',
                      description: attributeInfo?.summary,
                      popularity: 1,
                      url: '/en-US/docs/Web/API/HTMLAnchorElement/href',
                    },
                  ]
                : []
            if (
              !acc[interfaceName].attributes.find(
                (attr) =>
                  attr.name.toLocaleLowerCase() ===
                  attrName.toLocaleLowerCase(),
              )
            ) {
              acc[interfaceName].attributes.push({
                name: attrName,
                description: attributeInfo?.summary,
                popularity: attributeInfo?.popularity ?? undefined,
                url: attributeInfo?.mdn_url,
              })
            }
          } else {
            // eslint-disable-next-line no-console
            console.warn(
              'Skipping invalid interface name:',
              mappedInterfaceName,
            )
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
          const attributeInfo = getAttributeInfo({
            namespace: 'HTML',
            attribute: attributePart,
            interfaceName,
          })
          let interfaceItem = groupedAttributes[interfaceName]
          if (!interfaceItem) {
            // Create the missing interface entry
            interfaceItem = {
              attributes: [
                {
                  name: attributePart,
                  description: attributeInfo?.summary,
                  popularity: attributeInfo?.popularity ?? undefined,
                  url: attributeInfo?.mdn_url,
                },
              ],
            }
            groupedAttributes[interfaceName] = interfaceItem
          }
          const attributeItem = interfaceItem.attributes?.find(
            (attr) =>
              attr.name.toLocaleLowerCase() ===
              attributePart.toLocaleLowerCase(),
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
              description: attributeInfo?.summary,
              options: [value],
              popularity: attributeInfo?.popularity ?? undefined,
              url: attributeInfo?.mdn_url,
            })
          }
        } else {
          // eslint-disable-next-line no-console
          console.warn('Skipping invalid forLink:', forLink, d)
        }
      })
    })

  // Inject commonly used Nordcraft data-* attributes
  const additionalInterfaceInfo: Array<{
    attribute: string
    interface: string
    description: string
    url?: string
    options?: string[]
    popularity?: number
  }> = [
    // Used to disable Nordcraft's default styles
    // See https://docs.nordcraft.com/styling/default-styles#custom-styles
    {
      attribute: 'data-unset-toddle-styles',
      interface: 'global',
      description:
        'Special Nordcraft data attribute that disables the default Nordcraft styles for an element and its children.',
      url: 'https://docs.nordcraft.com/styling/default-styles#custom-styles',
      popularity: 1,
    },
    // Used for theming
    {
      attribute: 'data-theme',
      interface: 'global',
      description:
        'Special Nordcraft data attribute that specifies the theme to be applied to an element and its children.',
      // TODO: Link to theming docs when available
      popularity: 1,
    },
    // Add missing options for the target attribute on anchor and form elements
    {
      attribute: 'target',
      interface: 'HTMLAnchorElement',
      description: 'Specifies where to open the linked document.',
      options: ['_self', '_blank', '_parent', '_top'],
      url: '/en-US/docs/Web/API/HTMLAnchorElement/target',
    },
    {
      attribute: 'target',
      interface: 'HTMLFormElement',
      description:
        'Specifies where to display the response after submitting the form.',
      options: ['_self', '_blank', '_parent', '_top'],
      url: '/en-US/docs/Web/API/HTMLFormElement/target',
    },
  ]
  additionalInterfaceInfo.forEach((info) => {
    groupedAttributes[info.interface] ??= {}
    groupedAttributes[info.interface]!.attributes ??= []
    let attribute = groupedAttributes[info.interface]!.attributes?.find(
      (attr) =>
        attr.name.toLocaleLowerCase() === info.attribute.toLocaleLowerCase(),
    )
    if (!attribute) {
      attribute = {
        name: info.attribute,
        description: info.description,
        url: info.url,
        popularity: info.popularity,
      }
      groupedAttributes[info.interface]!.attributes!.push(attribute)
    }
    if (info.options) {
      attribute.options ??= []
      info.options.forEach((option) => {
        if (!attribute!.options!.includes(option)) {
          attribute!.options!.push(option)
        }
      })
    }
  })

  // Add events
  const events = await listAllEvents()
  events.forEach((e) => {
    e.targets.forEach((et) => {
      const interfaceName = et.target
      if (typeof interfaceName !== 'string') {
        // eslint-disable-next-line no-console
        console.warn('Skipping invalid event target interface:', et)
        return
      }
      let eventInfo = getEventInfo({ interfaceName, eventName: e.type })
      if (!eventInfo) {
        // As a fallback, try to get event info from the first inherited interface
        const eventInterfaces = inheritedInterfaces(interfaceName, false)
        const parentInterface = eventInterfaces.at(1)
        if (typeof parentInterface === 'string') {
          // Try to get event info from the interface's parent interface
          eventInfo = getEventInfo({
            interfaceName: parentInterface,
            eventName: e.type,
          })
        }
      }
      let interfaceItem = groupedAttributes[interfaceName]
      if (!interfaceItem) {
        interfaceItem = { events: [] }
        groupedAttributes[interfaceName] = interfaceItem
      }
      interfaceItem.events ??= []
      interfaceItem.events.push({
        name: e.type,
        description: eventInfo?.summary,
        popularity: eventInfo?.popularity ?? undefined,
        url: eventInfo?.mdn_url,
      })
    })
  })

  // Sort all attributes and events
  const sortedData = Object.fromEntries(
    Object.entries(groupedAttributes)
      .filter(
        (args): args is [string, HtmlInterfaceDefinition] =>
          args[1] !== undefined,
      )
      .map(([interfaceName, data]) => [
        interfaceName,
        {
          attributes: data.attributes
            ? data.attributes
                .toSorted(sortByPopularityOrAlphabetical)
                .map(({ popularity: _, ...a }) => a)
            : undefined,
          events: data.events
            ? data.events
                .toSorted(sortByPopularityOrAlphabetical)
                .map(({ popularity: _, ...e }) => e)
            : undefined,
        },
      ]),
  )
  return sortedData
}
