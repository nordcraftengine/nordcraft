export type SelectionAnchor = {
  node: Node
  offset: number
  wordStart: number
  wordEnd: number
}

export type SelectionMode = 'char' | 'word' | 'all'
