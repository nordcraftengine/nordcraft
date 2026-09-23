import type { CustomPropertyDefinition } from '@nordcraft/core/dist/styling/theme'
import type { IssueRule } from '../../../types'

export const animatedStyleNotInThemeRule: IssueRule = {
  code: 'animated style not in theme',
  level: 'warning',
  category: 'No References',
  visit: (report, { files, value, path, nodeType }) => {
    if (nodeType !== 'animation') {
      return
    }

    const themeProperties = files.themes?.Default?.propertyDefinitions
    if (!themeProperties) {
      return
    }

    const keyframes = Object.values(value.value)
    const animatedProperties = new Set<string>()

    keyframes.forEach((keyframe) => {
      if (keyframe.key?.startsWith('--')) {
        animatedProperties.add(keyframe.key)
      }
    })

    if (animatedProperties.size === 0) {
      return
    }

    for (const prop of animatedProperties) {
      if (
        !(themeProperties[prop as `--${string}`] as
          | CustomPropertyDefinition
          | undefined)
      ) {
        report({
          path: [...path, 'style', prop],
          info: {
            title: `Animated CSS variable is not declared in theme`,
            description: `Only globally declared CSS variables with a correct syntax type can be animated. Declare the CSS variable "${prop}" in the theme or remove it from the animation.`,
          },
        })
      }
    }
  },
}
