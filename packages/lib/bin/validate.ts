import * as fs from 'fs'
import { validate } from 'jsonschema'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const resolvePath = (...segments: string[]) =>
  path.resolve(__dirname, ...segments)

const validateJsonFile = (filePath: string) => {
  const file = fs.readFileSync(resolvePath(filePath), 'utf8')
  const json = JSON.parse(file)
  const schemaRef = json['$schema']
  if (!schemaRef) {
    return { valid: true, errors: [] }
  }
  const schemaFile = fs.readFileSync(
    resolvePath(path.dirname(filePath), schemaRef),
    'utf8',
  )
  const schema = JSON.parse(schemaFile)
  return validate(json, schema)
}

const actions = fs.readdirSync(resolvePath('../actions'))
actions.forEach((action) => {
  const actionPath = `../actions/${action}/action.json`
  if (fs.existsSync(resolvePath(actionPath))) {
    const result = validateJsonFile(actionPath)
    if (!result.valid) {
      process.exit(1)
    }
  }
})
