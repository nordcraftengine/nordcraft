import type { NodeModel } from '@nordcraft/core/dist/component/component.types'
import type { Level, Rule } from '../../../types'

export function createStaticSizeConstraintRule(
  tag: string,
  maxSize: number,
  level: Level = 'info',
): Rule<{
  tag: string
  size: number
}> {
  return {
    code: 'size constraint',
    category: 'Performance',
    level: level,
    visit: (report, args) => {
      if (
        args.nodeType === 'component-node' &&
        args.value.type === 'element' &&
        args.value.tag === tag
      ) {
        let size = 0
        const component = args.component
        const evaluateElement = (element?: NodeModel): string => {
          if (
            !element ||
            ['element', 'text', 'slot', 'component'].includes(element.type) ===
              false
          ) {
            return ''
          }
          const children = (element.children ?? []).map((child) =>
            evaluateElement(component.nodes?.[child]),
          )
          const tag = element.type === 'element' ? element.tag : 'span'
          return `<${tag}>${children.join('')}</${tag}>`
        }
        const staticElement = evaluateElement(args.value)
        size = new Blob([staticElement]).size
        if (size > maxSize) {
          const formatNumber = (num: number) => Intl.NumberFormat().format(num)
          report({
            path: args.path,
            info: {
              title: `Element size exceeds the suggested maximum allowed size of ${formatNumber(maxSize)} bytes`,
              description: `The <${tag}> element has a size of ${formatNumber(size)} bytes, which exceeds the suggested limit of ${formatNumber(maxSize)} bytes. Consider simplifying the content or structure of this element to reduce its size and improve performance.`,
            },
            details: { tag, size },
          })
        }
      }
    },
  }
}
