import { writeFileSync } from 'fs'

// Fetches HTML attributes from the webref repository and generates a JSON file
// mapping HTML interfaces to their attributes.
// The file is saved as ./interfaces/htmlInterfaceAttributes.json

const mapInterfaceName = (name: string) => {
  const interfaceMapping: Partial<Record<string, string>> = {
    'html-global': 'global',
  }
  return interfaceMapping[name] ?? name
}

const definitions: {
  spec: { title: string; url: string }
  dfns: Array<{
    id: string
    href: string
    linkingText: string[]
    localLinkingText: []
    type: 'attribute' | 'element-attr' | 'dfn' // We only care about attributes and element-attr
    for: string[]
    access: 'public' | 'private' // Not relevant
    informative: boolean // Not relevant
    heading: any // Not relevant
    definedIn: string // Not relevant
    links: [] // Not relevant
  }>
} = await fetch(
  'https://raw.githubusercontent.com/w3c/webref/refs/heads/main/ed/dfns/html.json',
).then((res) => res.json())
const groupedAttributes = definitions.dfns
  .filter(
    (d) =>
      // Ignore all event attributes
      !d.id.startsWith('handler-') &&
      // Only keep attributes
      d.type === 'attribute',
  )
  .reduce(
    (acc, d) => {
      const attrName = d.linkingText[0]
      if (typeof attrName !== 'string') {
        throw new Error('Invalid attribute name for dfn: ' + JSON.stringify(d))
      }
      if (attrName.startsWith('[[') && attrName.endsWith(']]')) {
        return acc // Skip internal attributes
      }
      const interfaceNames = d.for
      interfaceNames.forEach((_interfaceName) => {
        const interfaceName = mapInterfaceName(_interfaceName)
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!acc[interfaceName]) {
          acc[interfaceName] = {
            // The 'href' attribute is currently missing in the webref data for the HTMLAnchorElement interface
            attributes: interfaceName === 'HTMLAnchorElement' ? ['href'] : [],
          }
        }
        acc[interfaceName].attributes.push(attrName)
      })
      return acc
    },
    {} as Record<string, { attributes: string[] }>,
  )
writeFileSync(
  `./interfaces/htmlInterfaceAttributes.json`,
  JSON.stringify(
    Object.entries(groupedAttributes).reduce<
      Array<{ name: string; attributes: string[] }>
    >(
      (acc, [interfaceName, data]) => [
        ...acc,
        { name: interfaceName, attributes: data.attributes.toSorted() },
      ],
      [],
    ),
    null,
    2,
  ),
  'utf-8',
)
