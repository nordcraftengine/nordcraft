import type { ElementNodeModel } from '@nordcraft/core/dist/component/component.types'

export interface ExportedHtmlElement {
  metadata: {
    description?: string
    link?: string
    aliases?: string[]
  }
  element: {
    type: 'nodes'
    source: 'catalog'
    nodes: Record<string, ElementNodeModel>
  }
}
