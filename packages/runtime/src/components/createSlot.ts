import type {
  NodeModel,
  SlotNodeModel,
} from '@nordcraft/core/dist/component/component.types'
import type { Nullable } from '@nordcraft/core/dist/types'
import type { NodeRenderer } from './createNode'
import { createNode } from './createNode'

export function createSlot({
  path,
  node,
  dataSignal,
  ctx,
  parentElement,
  instance,
  namespace,
}: NodeRenderer<SlotNodeModel>): ReadonlyArray<Element | Text> {
  const slotName = node.name ?? 'default'
  let children: Array<Element | Text> = []
  // Is slotted content provided?
  if (ctx.children[slotName]) {
    children = ctx.children[slotName].flatMap((child) => {
      const childDataSignal = child.dataSignal.map((data) => data)
      dataSignal.subscribe((data) => data, {
        destroy: () => childDataSignal.destroy(),
      })
      const slotComponentIndex = getSlotComponentIndex(
        slotName,
        node,
        ctx.component.nodes,
      )

      return createNode({
        ...child,
        dataSignal: childDataSignal,
        parentElement,
        ctx: {
          ...child.ctx,
          providers: ctx.providers,
        },
        instance,
        namespace,
        path:
          slotComponentIndex > 0
            ? `${child.path}(${slotComponentIndex})`
            : child.path,
      })
    })
  } else {
    // Otherwise, return placeholder content
    children = node.children.flatMap((child, i) => {
      return createNode({
        id: child,
        path: path + '.' + i,
        dataSignal,
        ctx,
        parentElement,
        instance,
        namespace,
      })
    })
  }

  if (ctx.env.runtime === 'custom-element' && ctx.isRootComponent) {
    const webComponentSlot = document.createElement('slot')
    webComponentSlot.setAttribute('name', slotName)
    children.forEach((child) => {
      webComponentSlot.appendChild(child)
    })

    return [webComponentSlot]
  }

  return children
}

/**
 * When multiple slots have the same name, we need to ensure that their path still remains unique.
 */
function getSlotComponentIndex(
  nodeName: string,
  node: NodeModel,
  componentNodes: Nullable<Record<string, NodeModel>>,
) {
  let slotsWithSameNameIndex = 0
  if (componentNodes) {
    for (const n in componentNodes) {
      const currentNode = componentNodes[n]
      if (currentNode.type === 'slot' && currentNode.name === nodeName) {
        if (currentNode === node) {
          break
        }
        slotsWithSameNameIndex++
      }
    }
  }
  return slotsWithSameNameIndex
}
