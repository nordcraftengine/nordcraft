import validate from './component.js'

export const validateComponent = (component: any) => {
  const valid = validate(component)
  return {
    valid,
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    errors: valid ? [] : (((validate as any).errors as any[]) ?? []),
  }
}
