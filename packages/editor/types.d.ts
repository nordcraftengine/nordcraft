import type { NodeModel } from '@nordcraft/core/dist/component/component.types'

export interface ExportedHtmlElement {
  metadata: {
    name: string
    categories: ExportedHtmlElementCategory[]
    description?: string
    link?: string
    aliases?: string[]
    isVoid?: true
  }
  element: {
    type: 'nodes'
    source: 'catalog'
    nodes: Record<string, NodeModel>
  }
}

export type ExportedHtmlElementCategory =
  | 'form'
  | 'typography'
  | 'media'
  | 'svg'
  | 'semantic'
