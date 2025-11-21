import { listAll as listAllEvents } from '@webref/events'
import { writeFileSync } from 'fs'

// Fetches HTML attributes from the webref repository and generates a JSON file
// mapping HTML interfaces to their attributes.
// The file is saved as ./interfaces/htmlInterfaceAttributes.json

interface HtmlDefinition {
  id: string
  href: string
  linkingText: string[]
  localLinkingText: string[]
  type: 'attribute' | 'element-attr' | 'dfn' // We only care about attributes and element-attr
  for: string[]
  access: 'public' | 'private' // Not relevant
  informative: boolean // Not relevant
  heading: any // Not relevant
  definedIn: string // Not relevant
  links: [] // Not relevant
}

interface HtmlInterfaceDefinition {
  attributes?: string[]
  events?: string[]
}

const EXCLUDED_ATTRIBUTE_NAMES = new Set(['innerHTML', 'outerHTML'])

const mapInterfaceName = (name: string) => {
  const interfaceMapping: Partial<Record<string, string>> = {
    'html-global': 'global',
  }
  return interfaceMapping[name] ?? name
}

const definitions: {
  spec: { title: string; url: string }
  dfns: HtmlDefinition[]
} = await fetch(
  'https://raw.githubusercontent.com/w3c/webref/refs/heads/main/ed/dfns/html.json',
).then((res) => res.json())
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
          // Only keep attributes and element-attr definitions (if they're global)
          d.type === 'attribute') ||
        (d.type === 'element-attr' &&
          (d.for.includes('html-global') || d.for.includes('global')))
      )
    },
  )
  .reduce(
    (acc, d) => {
      const attrName = d.linkingText[0]
      const interfaceNames = d.for
      interfaceNames.forEach((_interfaceName) => {
        const interfaceName = mapInterfaceName(_interfaceName)
        acc[interfaceName] ??= {}
        // The 'href' attribute is currently missing in the webref data for the HTMLAnchorElement interface
        // So we add it manually here
        acc[interfaceName].attributes ??=
          interfaceName === 'HTMLAnchorElement' ? ['href'] : []
        acc[interfaceName].attributes.push(attrName)
      })
      return acc
    },
    {} as Partial<Record<string, HtmlInterfaceDefinition>>,
  )

// Add events
const events = await listAllEvents()
events.forEach((e) => {
  e.targets.forEach((et) => {
    let interfaceItem = groupedAttributes[et.target]
    if (!interfaceItem) {
      interfaceItem = { attributes: [] }
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
            attributes: data.attributes?.toSorted(),
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
