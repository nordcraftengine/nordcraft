import { listAll } from '@webref/elements'

const elementDefinitions = (await listAll())?.['html']?.elements

export const getElementInterface = (element: string) =>
  element === 'global'
    ? 'global'
    : elementDefinitions?.find((el) => el.name === element)?.interface
