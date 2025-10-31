declare module 'mdn-data' {
  interface Property {
    syntax: string
    media: string
    inherited: boolean
    animationType: string
    percentages: string
    groups: string[]
    initial: string
    appliesto: string
    computed: string
    order: string
    status: string
    mdn_url: string
  }

  interface Syntax {
    syntax: string
  }

  export const css: {
    properties: Record<string, Property>
    syntaxes: Record<string, Syntax>
  }
}
