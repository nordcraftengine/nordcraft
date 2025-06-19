import type { ElementNodeModel } from '@nordcraft/core/dist/component/component.types'
import type { ComponentContext } from '../types'

export function getElementTagName(
  node: ElementNodeModel,
  ctx: ComponentContext,
  id: string,
) {
  if (ctx.component.version === 2 && id === 'root') {
    return `${ctx.package ?? ctx.nordcraft.project}-${node.tag}`
  }

  return node.tag
}
