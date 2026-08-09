import type {
  Component,
  NodeModel,
  SlotNodeModel,
} from '@nordcraft/core/dist/component/component.types'
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
  slotRepeatIndex,
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

      const childPath = [...child.path]
      if (slotComponentIndex > 0 || slotRepeatIndex) {
        const lastPart = { ...childPath[childPath.length - 1] }
        if (slotComponentIndex > 0) {
          lastPart.slotComponentIndex = slotComponentIndex
        }
        if (slotRepeatIndex && slotRepeatIndex > 0) {
          lastPart.repeatIndex = slotRepeatIndex
        }
        childPath[childPath.length - 1] = lastPart
      }

      return createNode({
        ...child,
        path: childPath,
        dataSignal: childDataSignal,
        parentElement,
        ctx: {
          ...child.ctx,
          providers: ctx.providers,
          jsonPath: ['nodes', child.id],
        },
        instance,
        namespace,
      })
    })
  } else {
    // Otherwise, return placeholder content
    children = (node.children ?? []).flatMap((child, i) => {
      return createNode({
        id: child,
        path: [
          ...path,
          {
            index: i,
            repeatIndex: 0,
            slotName: 'default',
            slotComponentIndex: 0,
          },
        ],
        dataSignal,
        ctx: { ...ctx, jsonPath: ['nodes', child] },
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
  componentNodes: Component['nodes'],
) {
  let slotsWithSameNameIndex = 0
  if (componentNodes) {
    for (const n in componentNodes) {
      const currentNode = componentNodes[n]
      if (currentNode?.type === 'slot' && currentNode.name === nodeName) {
        if (currentNode === node) {
          break
        }
        slotsWithSameNameIndex++
      }
    }
  }
  return slotsWithSameNameIndex
}
