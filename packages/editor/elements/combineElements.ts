import { readdirSync, readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import type { ExportedHtmlElement } from '../types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const resolvePath = (...segments: string[]) =>
  path.resolve(__dirname, ...segments)

export const combineElements = (): ExportedHtmlElement[] => {
  // Read all JSON files in the html and svg directories, parse them, and return as an array of ExportedHtmlElement
  // This assumes that each file is named with a valid HTML element name and contains a valid JSON structure
  const htmlDir = resolvePath('./html')
  const htmlElements = readdirSync(htmlDir)
    .sort()
    .map((el) => {
      const element = readFileSync(resolvePath('./html', el), 'utf-8')
      const parsedElement = JSON.parse(element)
      return parsedElement as ExportedHtmlElement
    })
  const svgDir = resolvePath('./svg')
  const svgElements = readdirSync(svgDir)
    .sort()
    .map((el) => {
      const element = readFileSync(resolvePath('./svg', el), 'utf-8')
      const parsedElement = JSON.parse(element)
      return parsedElement as ExportedHtmlElement
    })
  return [...htmlElements, ...svgElements]
}
