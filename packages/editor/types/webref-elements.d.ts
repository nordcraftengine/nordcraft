// See https://github.com/microsoft/TypeScript-DOM-lib-generator/blob/main/src/build/webref/webref-elements.d.ts
declare module '@webref/elements' {
  interface Spec {
    title: string
    url: string
  }
  interface Element {
    name: string
    interface?: string
    obsolete?: true
  }
  interface Item {
    spec: Spec
    elements: Element[]
  }
  function listAll(): Promise<Record<string, Item>>
}
