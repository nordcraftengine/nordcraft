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
  return {
    code: 'required direct parent',
    level,
    category: 'Accessibility',
    nodeTypes: 'component-node',
    visit: (report, args) => {
      const { value, component, path } = args
      if (value?.type !== 'element' || !childTags.includes(value.tag)) {
        return
      }
      const nodeId = String(args.path[args.path.length - 1])
      const parent = Object.values(component.nodes ?? {}).find(
        (node) => node?.type === 'element' && node.children?.includes(nodeId),
      )
      if (parent?.type === 'element' && !parentTags.includes(parent.tag)) {
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
