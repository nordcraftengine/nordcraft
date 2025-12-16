import type { Level, Rule } from '../../../types'

export function createRequiredDirectParentRule(
  parentTags: string[],
  childTags: string[],
  level: Level = 'warning',
): Rule<{
  parentTag: string
  childTag: string
  allowedParentTags: string[]
}> {
  return {
    code: 'required direct parent',
    level,
    category: 'Accessibility',
    visit: (report, args) => {
      if (args.nodeType !== 'component-node') {
        return
      }
      const { value, component, path } = args
      if (value.type !== 'element' || !childTags.includes(value.tag)) {
        return
      }
      const nodeId = String(args.path[args.path.length - 1])
      const parent = Object.values(component.nodes ?? {}).find(
        (node) => node.type === 'element' && node.children.includes(nodeId),
      )
      if (parent?.type === 'element' && !parentTags.includes(parent.tag)) {
        report(path, {
          parentTag: parent.tag,
          childTag: value.tag,
          allowedParentTags: parentTags,
        })
      }
    },
  }
}
