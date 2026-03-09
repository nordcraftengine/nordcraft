import type { NodeStyleModel } from '@nordcraft/core/dist/component/component.types'
import type { Nullable } from '@nordcraft/core/dist/types'
import type { Rule } from '../../../types'
import { removeFromPathFix } from '../../../util/removeUnused.fix'

export const noReferenceAnimationRule: Rule = {
  code: 'no-reference animation',
  level: 'warning',
  category: 'No References',
  visit: (report, args) => {
    if (args.nodeType !== 'animation') {
      return
    }

    const { value, node, path, memo } = args
    const nodePath = path.slice(0, -1).join('.')
    const usedAnimation = memo(`animations-${nodePath}`, () => {
      const animations = new Set<string>()
      const visitStyle = (style: Nullable<NodeStyleModel>) =>
        Object.values(style ?? {})
          .filter((value) => typeof value === 'string')
          .flatMap((value) =>
            value
              .split(',')
              .flatMap((animation) => animation.trim().split(' ')),
          )
          .forEach((animation) => {
            animations.add(animation)
          })

      visitStyle(node.style)
      Object.values(node.variants ?? {}).forEach((variant) =>
        visitStyle(variant.style),
      )
      return animations
    })

    if (usedAnimation.has(value.key)) {
      return
    }

    report({
      path: path,
      info: {
        title: `Unused animation`,
        description: `The animation "${value.key}" is defined but never used. Edit the element to clean unused animations.`,
      },
      fixes: ['delete-animation'],
    })
  },
  fixes: {
    'delete-animation': removeFromPathFix,
  },
}

export type NoReferenceAnimationRuleFix = 'delete-animation'
