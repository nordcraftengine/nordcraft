// Copies and modifies relevant assets and JSON files to the dist/ folder
// This script is executed by the build process
import { RESET_STYLES } from '@nordcraft/core/dist/styling/theme.const'
import { splitRoutes } from '@nordcraft/ssr/dist/utils/routes'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const resolvePath = (...segments: string[]) =>
  path.resolve(__dirname, ...segments)

// dist/ folder for the build output
const distPath = '../dist'
const distDir = resolvePath(distPath)
if (fs.existsSync(distDir)) {
  // Remove the dist folder
  fs.rmdirSync(distDir, { recursive: true })
}
fs.mkdirSync(distDir, { recursive: true })

// dist/assets/_static/ folder for static assets
const staticDir = resolvePath('../dist/assets/_static')
if (fs.existsSync(staticDir)) {
  fs.rmdirSync(staticDir, { recursive: true })
}
fs.mkdirSync(staticDir, { recursive: true })
;[
  'page.main.esm.js',
  'page.main.esm.js.map',
  'custom-element.main.esm.js',
].forEach((f) => {
  const source = resolvePath('../node_modules/@nordcraft/runtime/dist', f)
  const destination = resolvePath('../dist/assets/_static', f)
  fs.copyFileSync(source, destination)
})
fs.writeFileSync(resolvePath('../dist/assets/_static/reset.css'), RESET_STYLES)

// Read the project.json file and split it into routes and files
const projectFile = fs.readFileSync(resolvePath('../__project__/project.json'))
const json = JSON.parse(projectFile.toString())
const { project, routes, files, styles, code } = splitRoutes(json)
// Create a stylesheet for each component
Object.entries(styles).forEach(([name, style]) => {
  const styleDestination = resolvePath('../dist/assets/_static', `${name}.css`)
  fs.writeFileSync(styleDestination, style)
})
// Create a js file with custom code for each component
Object.entries(code).forEach(([name, c]) => {
  const ccDestination = resolvePath('../dist/assets/_static', `cc_${name}.js`)
  fs.writeFileSync(ccDestination, c)
})
// Serving dynamic assets as ESModule is slightly faster than JSON
const jsiFy = (obj: any) => `export default ${JSON.stringify(obj)}`
fs.writeFileSync(resolvePath(`${distPath}/project.js`), jsiFy(project))
fs.writeFileSync(resolvePath(`${distPath}/routes.js`), jsiFy(routes))
fs.mkdirSync(resolvePath(`${distPath}/components`), { recursive: true })
Object.entries(files).forEach(([name, file]) => {
  fs.writeFileSync(
    resolvePath(`${distPath}/components/`, `${name.toLowerCase()}.js`),
    jsiFy(file),
  )
})
