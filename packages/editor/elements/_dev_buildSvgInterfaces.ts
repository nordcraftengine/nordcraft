import { listAll as listAllEvents } from '@webref/events'
import { writeFileSync } from 'fs'
import { getSvgElementInterface, isHtmlInterface } from './utils'

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
  options?: string[]
}

interface SvgInterfaceDefinition {
  attributes?: Array<SvgAttributeDefinition>
  events?: string[]
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
      const interfaceNames = d.for
      interfaceNames.forEach((_interfaceName) => {
        const mappedInterfaceName = mapInterfaceName(_interfaceName)
        if (typeof mappedInterfaceName !== 'string') {
          return acc
        }
        if (isHtmlInterface(mappedInterfaceName)) {
          // Attributes declared directly on HTML interfaces are skipped
          // as they are sometimes properties rather than attributes
          // All attributes should be included directly from elements
          return acc
        }
        const interfaceName = getSvgElementInterface(mappedInterfaceName)
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
    const interfaceItem = groupedAttributes[mapSvgInterfaceName(et.target)]
    if (!interfaceItem) {
      // We'll skip events for missing interfaces to ensure we don't add all HTML elements
      return
    }
    interfaceItem.events ??= []
    interfaceItem.events.push(e.type)
  })
})

// Sort all interfaces and write to file
writeFileSync(
  `./interfaces/svgInterfaces.json`,
  JSON.stringify(
    Object.entries(groupedAttributes)
      .toSorted(([a], [b]) => a.localeCompare(b))
      // To help Typescript narrow the type
      .filter(
        (args): args is [string, SvgInterfaceDefinition] =>
          args[1] !== undefined,
      )
      .reduce<Array<SvgInterfaceDefinition & { name: string }>>(
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
