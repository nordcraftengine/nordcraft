import { readdirSync, readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import type { ExportedHtmlElement } from '../types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const resolvePath = (...segments: string[]) =>
  path.resolve(__dirname, ...segments)

export const combineHtmlElements = (): ExportedHtmlElement[] => {
  // Read all JSON files in the elements directory, parse them, and return as an array of ExportedHtmlElement
  // This assumes that each file is named with a valid HTML element name and contains a valid JSON structure
  const elementsDir = resolvePath('./elements')
  return readdirSync(elementsDir)
    .sort()
    .map((el) => {
      const element = readFileSync(resolvePath('./elements', el), 'utf-8')
      const parsedElement = JSON.parse(element)
      return parsedElement as ExportedHtmlElement
    })
}
