import type { NodeModel } from '@nordcraft/core/dist/component/component.types'
import type { Level, Rule } from '../../../types'

export function createRequiredDirectChildRule(
  parentTags: string[],
  childTags: string[],
  level: Level = 'warning',
): Rule<{
  parentTag: string
  childTag: string
  allowedChildTags: string[]
}> {
  return {
    code: 'required direct child',
    level,
    category: 'Accessibility',
    visit: (report, args) => {
      if (args.nodeType !== 'component-node') {
        return
      }
      const { value, component, path } = args
      if (value.type !== 'element' || !parentTags.includes(value.tag)) {
        return
      }
      const getElement = (id: string): NodeModel | undefined =>
        component.nodes[id]
      value.children.forEach((childId) => {
        const childNode = getElement(childId)
        if (
          childNode &&
          childNode.type === 'element' &&
          !childTags.includes(childNode.tag)
        ) {
          report([...path.slice(0, 3), childId], {
            parentTag: value.tag,
            childTag: childNode.tag,
            allowedChildTags: childTags,
          })
        }
      })
    },
  }
}
