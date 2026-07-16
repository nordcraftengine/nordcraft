import type { Path } from '../types'

export function pathToString(path: Path): string {
  return path
    .map((element) => {
      let segment = element.index.toString()
      if (element.slotName && element.slotName !== 'default') {
        segment += `[${element.slotName}]`
      }
      if (element.slotComponentIndex && element.slotComponentIndex > 0) {
        segment += `{${element.slotComponentIndex}}`
      }
      if (element.repeatIndex && element.repeatIndex > 0) {
        segment += `(${element.repeatIndex})`
      }
      return segment
    })
    .join('.')
}

export function stringToPath(path: string): Path {
  if (!path) return []

  return path.split('.').map((segment) => {
    const indexStr = segment.split(/[[({]/)[0]
    const index = parseInt(indexStr!)

    const slotMatch = segment.match(/\[(.*?)\]/)
    const slotName = slotMatch ? slotMatch[1] : 'default'

    const compMatch = segment.match(/\{(.*?)\}/)
    const slotComponentIndex = compMatch ? parseInt(compMatch[1]!) : 0

    const repeatMatch = segment.match(/\((.*?)\)/)
    const repeatIndex = repeatMatch ? parseInt(repeatMatch[1]!) : 0

    return {
      index,
      slotName,
      slotComponentIndex,
      repeatIndex,
    } as Path[number]
  })
}
