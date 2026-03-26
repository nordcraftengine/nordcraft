import { listAll as listAllEvents } from '@webref/events'
import {
  getAttributeInfo,
  getEventInfo,
  getSvgElementInterface,
  inheritedInterfaces,
  initMdnMetadata,
  isSvgInterface,
  sortByPopularityOrAlphabetical,
} from './utils'

// Fetches SVG attributes from the webref repository and generates a JSON file
// mapping SVG interfaces to their attributes.
// The file is saved as ./interfaces/svgInterfaceAttributes.json

interface SvgDefinition {
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

interface SvgAttributeDefinition {
  name: string
  description?: string
  options?: string[]
  popularity?: number
  url?: string
}

interface SvgEventDefinition {
  name: string
  description?: string
  popularity?: number
  url?: string
}

interface SvgInterfaceDefinition {
  attributes?: Array<SvgAttributeDefinition>
  events?: Array<SvgEventDefinition>
}

const EXCLUDED_ATTRIBUTE_NAMES = new Set(['innerHTML', 'outerHTML'])

const SVG_DEFINITIONS_URL =
  'https://raw.githubusercontent.com/w3c/webref/refs/heads/main/ed/dfns/SVG2.json'
const FILTER_EFFECT_DEFINITIONS_URL =
  'https://raw.githubusercontent.com/w3c/webref/refs/heads/main/ed/dfns/filter-effects-1.json'

const mapInterfaceName = (name?: string) => {
  const interfaceMapping: Partial<Record<string, string>> = {
    'html-global': 'global',
  }
  return typeof name === 'string' ? (interfaceMapping[name] ?? name) : name
}

export const getSvgInterfaces = async () => {
  // Fetch SVG definitions from the webref repository
  const definitions: {
    spec: { title: string; url: string }
    dfns: SvgDefinition[]
  } = await fetch(SVG_DEFINITIONS_URL).then((res) => res.json())
  // Fetch filter-effects definitions from the webref repository
  const filterEffectDefinitions: {
    spec: { title: string; url: string }
    dfns: SvgDefinition[]
  } = await fetch(FILTER_EFFECT_DEFINITIONS_URL).then((res) => res.json())
  // Append all filter-effects definitions
  definitions.dfns.push(...filterEffectDefinitions.dfns)

  // Initialize additional MDN metadata
  await initMdnMetadata()

  // Group attributes by their interfaces
  const groupedAttributes = definitions.dfns
    .filter(
      // Make Typescript aware that linkingText[0] exists if the filter is truthy
      (d): d is SvgDefinition & { linkingText: [string, ...string[]] } => {
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
        const elementOrInterfaceNames = d.for
        elementOrInterfaceNames.forEach((_interfaceName) => {
          const mappedElementOrInterfaceName = mapInterfaceName(_interfaceName)
          if (typeof mappedElementOrInterfaceName !== 'string') {
            return acc
          }
          let interfaceName = getSvgElementInterface(
            mappedElementOrInterfaceName,
          )
          const attributeInfo = getAttributeInfo({
            namespace: 'SVG',
            attribute: attrName,
            interfaceName,
          })
          if (
            typeof interfaceName !== 'string' &&
            isSvgInterface(mappedElementOrInterfaceName)
          ) {
            // We need to make sure we can look up info about this attribute
            // to make sure it's not a property
            if (!attributeInfo) {
              // eslint-disable-next-line no-console
              console.warn(
                'Unable to find attribute info for',
                attrName,
                'Skipping as it might be a property.',
              )
              return
            }
            interfaceName = mappedElementOrInterfaceName
          }
          if (typeof interfaceName === 'string') {
            // We'll help Typescript recognize the key as a string
            const interfaceKey = interfaceName as string
            acc[interfaceKey] ??= {}
            acc[interfaceKey].attributes ??= []
            if (
              !acc[interfaceKey].attributes.find(
                (attr) =>
                  attr.name.toLocaleLowerCase() ===
                  attrName.toLocaleLowerCase(),
              )
            ) {
              acc[interfaceKey].attributes.push({
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
              mappedElementOrInterfaceName,
            )
          }
        })
        return acc
      },
      {} as Partial<Record<string, SvgInterfaceDefinition>>,
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
          const interfaceName = getSvgElementInterface(mappedElement)
          if (!interfaceName) {
            // eslint-disable-next-line no-console
            console.warn(`No interface for element: ${mappedElement}`)
            return
          }
          const attributeInfo = getAttributeInfo({
            namespace: 'SVG',
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
                  options: [value],
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

  const SVG_INTERFACE_NAME_MAPPING: Record<string, string> = {
    SVGElement: 'SVGSVGElement',
    SVGAnimationElement: 'SVGAnimateElement',
  }
  const mapSvgInterfaceName = (name: string) =>
    SVG_INTERFACE_NAME_MAPPING[name] ?? name

  // Add events
  const events = await listAllEvents()
  events.forEach((e) => {
    e.targets.forEach((et) => {
      const interfaceName = mapSvgInterfaceName(et.target)
      const interfaceItem = groupedAttributes[interfaceName]
      if (!interfaceItem) {
        // We'll skip events for missing interfaces to ensure we don't add all HTML elements
        return
      }
      let eventInfo = getEventInfo({ interfaceName, eventName: e.type })
      if (!eventInfo) {
        // As a fallback, try to get event info from any inherited interface
        const eventInterfaces = inheritedInterfaces(interfaceName, false)
        let parentIndex = 1
        while (parentIndex < eventInterfaces.length && !eventInfo) {
          const parentInterface = eventInterfaces.at(parentIndex)
          if (typeof parentInterface !== 'string') {
            break
          }
          // Try to get event info from the interface's parent interface
          eventInfo = getEventInfo({
            interfaceName: parentInterface,
            eventName: e.type,
          })
          parentIndex++
        }
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

  // Sanitize data to avoid SVGSVG* interfaces
  const stanitizedData = Object.fromEntries(
    Object.entries(groupedAttributes).map(([interfaceName, data]) => [
      interfaceName.replaceAll('SVGSVG', 'SVG'),
      data,
    ]),
  )

  // Sort all attributes and events
  const sortedData = Object.fromEntries(
    Object.entries(stanitizedData)
      .filter(
        (args): args is [string, SvgInterfaceDefinition] =>
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
