import type { NodeModel } from '@nordcraft/core'

export interface ExportedHtmlElement {
  metadata: {
    name: string
    categories: ExportedHtmlElementCategory[]
    description?: string
    link?: string
    aliases?: string[]
    isVoid?: true
    isPopular?: true
    permittedChildren?: string[]
    permittedParents?: string[]
    interfaces: string[] | undefined
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
