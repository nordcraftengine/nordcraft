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

    const usedAnimations = new Set<string>()
    const visitStyle = (style: Nullable<NodeStyleModel>) =>
      Object.entries(style ?? {})
        .flatMap(([_, value]) =>
          String(value)
            .split(',')
            .map((animation) => animation.trim().split(' ')[0]),
        )
        .forEach((animation) => {
          usedAnimations.add(animation)
        })

    visitStyle(args.node.style)
    Object.values(args.node.variants ?? {}).forEach((variant) =>
      visitStyle(variant.style),
    )

    if (usedAnimations.has(args.value.key)) {
      return
    }

    report({
      path: args.path,
      info: {
        title: `Unused animation`,
        description: `The animation "${args.value.key}" is defined but never used. Edit the element to clean unused animations.`,
      },
      fixes: ['delete-animation'],
    })
  },
  fixes: {
    'delete-animation': removeFromPathFix,
  },
}

export type NoReferenceAnimationRuleFix = 'delete-animation'
