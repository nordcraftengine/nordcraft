export const clamp = (val: number, min: number, max: number) =>
  Math.min(Math.max(val, min), max)

export const toSeconds = (value: string) => {
  if (value.endsWith('ms')) {
    return parseFloat(value) / 1000
  } else {
    return parseFloat(value)
  }
}
