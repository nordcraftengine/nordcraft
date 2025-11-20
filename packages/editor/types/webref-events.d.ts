// See https://github.com/microsoft/TypeScript-DOM-lib-generator/blob/main/src/build/webref/webref-events.d.ts
declare module '@webref/events' {
  interface Src {
    format: string
    href: string
  }
  interface Target {
    target: string
    bubbles?: boolean
    bubblingPath?: string[]
  }
  interface Item {
    src: Src
    href: string
    type: string
    targets: Target[]
    interface: string
  }
  function listAll(): Promise<Array<Item>>
}
