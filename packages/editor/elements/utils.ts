import { listAll } from '@webref/elements'
import { api } from 'mdn-data'

const elementDefinitions = (await listAll())?.['html']?.elements

export const getElementInterface = (element: string) =>
  element === 'global'
    ? 'global'
    : elementDefinitions?.find((el) => el.name === element)?.interface

export const isHtmlInterface = (interfaceName: string) =>
  api.inheritance[interfaceName] !== undefined
