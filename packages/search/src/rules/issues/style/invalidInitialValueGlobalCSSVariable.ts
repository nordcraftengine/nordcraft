import type { CustomPropertyName } from '@nordcraft/core/src/component/component.types'
import { validateInitialValue } from '@nordcraft/core/src/styling/customProperty'
import type { CustomPropertyDefinition } from '@nordcraft/core/src/styling/theme'
import type { IssueRule } from '../../../types'

export const invalidInitialValueGlobalCSSVariableRule: IssueRule<{
  key: CustomPropertyName
  value: CustomPropertyDefinition
}> = {
  code: 'invalid initial value',
  level: 'warning',
  category: 'Other',
  visit: (report, { path, value, nodeType }) => {
    if (nodeType !== 'project-theme-property') {
      return
    }

    const { key, value: definition } = value
    const { syntax, initialValue } = definition

    if (!initialValue || initialValue.trim() === '') {
      return
    }

    const { valid, error } = validateInitialValue(syntax, initialValue)
    if (valid) {
      return
    }

    switch (error) {
      case 'computationally dependent': {
        report({
          path,
          info: {
            title: `Initial value for ${key} is not computationally independent`,
            description: `A property value is computationally independent if it can be converted into a computed value using only the value of the property on the element, and "global" information that cannot be changed by CSS. e.g., use **px** instead of **em** or **var()**.`,
          },
        })
        break
      }
    }
  },
}
