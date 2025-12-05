import { listAll } from '@webref/elements'
import { api } from 'mdn-data'

// See https://www.npmjs.com/package/@webref/elements?activeTab=code
const htmlElementDefinitions = (await listAll())?.['html']?.elements
const svg1ElementDefinitions = (await listAll())?.['SVG11']?.elements
const svg2ElementDefinitions = (await listAll())?.['SVG2']?.elements
const filterEfectDefinitions = (await listAll())?.['filter-effects-1']?.elements

export const getHtmlElementInterface = (element: string) =>
  element === 'global'
    ? 'global'
    : htmlElementDefinitions?.find((el) => el.name === element)?.interface

export const getSvgElementInterface = (element: string) =>
  element === 'global'
    ? 'global'
    : (svg2ElementDefinitions?.find((el) => el.name === element)?.interface ??
      svg1ElementDefinitions?.find((el) => el.name === element)?.interface ??
      filterEfectDefinitions?.find((el) => el.name === element)?.interface)

export const isHtmlInterface = (interfaceName: string) =>
  api.inheritance[interfaceName] !== undefined
