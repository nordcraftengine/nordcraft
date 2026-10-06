import type { ComponentNodeNode, IssueRule, Level } from '../../../types'

export function createRequiredDirectParentRule(
  parentTags: string[],
  childTags: string[],
  level: Level = 'warning',
): IssueRule<
  {
    parentTag: string
    childTag: string
    allowedParentTags: string[]
  },
  ComponentNodeNode
> {
  const childTagSet = new Set(childTags)
  const parentTagSet = new Set(parentTags)
  return {
    code: 'required direct parent',
    level,
    category: 'Accessibility',
    nodeTypes: 'component-node',
    visit: (report, args) => {
      const { value, component, path, files, memo } = args
      if (value?.type !== 'element' || !childTagSet.has(value.tag)) {
        return
      }
      const nodeId = String(args.path[args.path.length - 1])
      const componentKey = String(path[1])
      const parentByNode = memo(`component-parents-${componentKey}`, () => {
        const map = new Map<string, string>()
        const nodes =
          files.components[componentKey]?.nodes ?? component.nodes ?? {}
        for (const [name, node] of Object.entries(nodes)) {
          const children = (node as { children?: unknown })?.children
          if (Array.isArray(children)) {
            for (const child of children) {
              if (typeof child === 'string' && !map.has(child)) {
                map.set(child, name)
              }
            }
          }
        }
        return map
      }) as Map<string, string>
      const parentName = parentByNode.get(nodeId)
      const parent =
        parentName !== undefined ? component.nodes?.[parentName] : undefined
      if (parent?.type === 'element' && !parentTagSet.has(parent.tag)) {
        report({
          path,
          info: {
            title: 'Invalid parent element',
            description: `**${value.tag}** should not have a direct parent of type **${parent.tag}**. Valid parents are: *${parentTags.join('*, *')}*.`,
          },
          details: {
            parentTag: parent.tag,
            childTag: value.tag,
            allowedParentTags: parentTags,
          },
        })
      }
    },
  }
}
