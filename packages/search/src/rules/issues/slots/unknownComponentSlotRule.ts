import { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import type { SlotNodeModel } from '@nordcraft/core/dist/component/component.types'
import type { Rule } from '../../../types'

export const unknownComponentSlotRule: Rule<{ slotName: string }> = {
  code: 'unknown component slot',
  level: 'error',
  category: 'Unknown Reference',
  visit: (report, { path, files, value, nodeType }) => {
    if (nodeType !== 'component-node') {
      return
    }

    // We only want to check the immediate children of a "sub component"
    if (value.type !== 'component' || (value?.children ?? []).length === 0) {
      return
    }

    const [, currentComponentName, ,] = path

    const component = files.components[value.name]
    if (!component) {
      return
    }
    // Load the component to get the slots
    const subComponent = new ToddleComponent({
      component,
      getComponent: (name) => files.components[name],
      packageName: undefined,
      globalFormulas: {
        formulas: files.formulas,
        packages: files.packages,
      },
    })

    const usableSlots = Object.values(subComponent.nodes ?? {})
      .filter((node): node is SlotNodeModel => node.type === 'slot')
      .map((node) => node.name ?? 'default')

    // Loop the children and report issue when using a slot that doesn't exist
    value.children.forEach((child) => {
      const childNode = files.components[currentComponentName]?.nodes?.[child]
      const usedSlot = childNode?.slot ?? 'default'

      if (!usableSlots.includes(usedSlot)) {
        report({
          path: [path[0], path[1], path[2], child],
          info: {
            title: 'Unknown component slot',
            description: `**${usedSlot}** slot name does not exist as a slot on the parent component.`,
          },
          details: { slotName: usedSlot },
        })
      }
    })
  },
}
