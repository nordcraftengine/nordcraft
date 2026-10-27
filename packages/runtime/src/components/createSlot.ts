import type { Component, NodeModel, SlotNodeModel } from '@nordcraft/core'
import '@nordcraft/core/compileTime'
import type { NodeRenderer } from './createNode'
import { createNode } from './createNode'

export function createSlot({
  path: slotPath,
  node,
  dataSignal,
  ctx,
  parentElement,
  instance,
  namespace,
  slotRepeatIndex,
  slotSuffix,
}: NodeRenderer<SlotNodeModel>): ReadonlyArray<Element | Text> {
  const slotName = node.name ?? 'default'
  let children: Array<Element | Text> = []
  // Is slotted content provided?
  if (ctx.children[slotName]) {
    const slotComponentIndex = getSlotComponentIndex(
      slotName,
      node,
      ctx.component.nodes,
    )

    let currentSuffix = slotSuffix ?? ''
    if (slotComponentIndex > 0) {
      currentSuffix += `{${slotComponentIndex}}`
    }
    if (slotRepeatIndex && slotRepeatIndex > 0) {
      currentSuffix += `(${slotRepeatIndex})`
    }

    children = ctx.children[slotName].flatMap((child, childIndex) => {
      const childDataSignal = child.dataSignal.fork()
      dataSignal.subscriptions.push(() => childDataSignal.destroy())

      let basePath = child.path
      if (slotPath.startsWith(`${child.path}.`)) {
        basePath = childIndex > 0 ? `${slotPath}.${childIndex}` : slotPath
      }

      const path =
        currentSuffix && !basePath.endsWith(currentSuffix)
          ? basePath + currentSuffix
          : basePath

      return createNode({
        ...child,
        dataSignal: childDataSignal,
        parentElement,
        ctx: {
          ...child.ctx,
          providers: ctx.providers,
          ...(IS_PREVIEW ? { jsonPath: ['nodes', child.id] } : {}),
        },
        instance,
        namespace,
        path,
        slotRepeatIndex,
        slotSuffix: currentSuffix || undefined,
      })
    })
  } else {
    // Otherwise, return placeholder content
    children = (node.children ?? []).flatMap((child, i) => {
      return createNode({
        id: child,
        path: slotPath + '.' + i,
        dataSignal,
        ctx:
          IS_PREVIEW && (ctx.reportFormulaEvaluation || ctx.jsonPath)
            ? { ...ctx, jsonPath: ['nodes', child] }
            : ctx,
        parentElement,
        instance,
        namespace,
        slotRepeatIndex,
        slotSuffix,
      })
    })
    if (IS_PREVIEW && ctx.env?.runtime === 'preview') {
      for (const child of children) {
        if (!(child instanceof Element)) {
          continue
        }
        if (!child.hasAttribute('data-node-slot-name')) {
          child.setAttribute('data-node-slot-name', slotName)
        } else if (child.getAttribute('data-node-slot-name') !== slotName) {
          const raw = child.getAttribute('data-node-slot-ancestors')
          let ancestors: string[] = []
          if (raw) {
            try {
              const parsed: unknown = JSON.parse(raw)
              if (Array.isArray(parsed)) {
                ancestors = parsed.filter(
                  (entry): entry is string => typeof entry === 'string',
                )
              }
            } catch {
              ancestors = []
            }
          }
          if (!ancestors.includes(slotName)) {
            ancestors.push(slotName)
            child.setAttribute(
              'data-node-slot-ancestors',
              JSON.stringify(ancestors),
            )
          }
        }
      }
    }
  }

  // Register native slot for web components
  if (IS_CUSTOM_ELEMENT && ctx.isRootComponent) {
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
      if (
        currentNode?.type === 'slot' &&
        (currentNode.name ?? 'default') === nodeName
      ) {
        if (currentNode === node) {
          break
        }
        slotsWithSameNameIndex++
      }
    }
  }
  return slotsWithSameNameIndex
}
