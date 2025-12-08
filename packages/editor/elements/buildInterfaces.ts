import { writeFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { getHtmlInterfaces } from './htmlInterfaces'
import { getSvgInterfaces } from './svgInterfaces'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const resolvePath = (...segments: string[]) => resolve(__dirname, ...segments)

const htmlInterfaces = await getHtmlInterfaces()
const svgInterfaces = await getSvgInterfaces()
writeFileSync(
  resolvePath(`./interfaces/interfaces.json`),
  JSON.stringify(
    Object.entries({ ...htmlInterfaces, ...svgInterfaces })
      .toSorted(([a], [b]) => a.localeCompare(b))
      .map(([name, data]) => ({
        name,
        ...data,
      })),
    null,
    2,
  ),
  'utf-8',
)
