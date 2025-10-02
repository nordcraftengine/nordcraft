import * as fs from 'fs'
import { type ValidationError, Validator } from 'jsonschema'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const resolvePath = (...segments: string[]) =>
  path.resolve(__dirname, ...segments)

const validator = new Validator()
// Let the validator know about the built-in schemas
const subSchemas = [
  'formula.schema.json',
  'valueFormula.schema.json',
  'pathFormula.schema.json',
  'arrayFormula.schema.json',
]
subSchemas.forEach((schemaFile) => {
  const schema = JSON.parse(
    fs.readFileSync(resolvePath(`../schemas/${schemaFile}`), 'utf8'),
  )
  validator.addSchema(schema, `/${schema['$id']}`)
})

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
  return validator.validate(json, schema)
}

const actions = fs.readdirSync(resolvePath('../actions'))
actions.forEach((action) => {
  const actionPath = `../actions/${action}/action.json`
  if (fs.existsSync(resolvePath(actionPath))) {
    const result = validateJsonFile(actionPath)
    if (!result.valid) {
      // eslint-disable-next-line no-console
      console.error(
        `Error validating ${actionPath}:`,
        result.errors.map((e: ValidationError) => e.message),
      )
      process.exit(1)
    }
  }
})
const formulas = fs.readdirSync(resolvePath('../formulas'))
formulas.forEach((formula) => {
  const formulaPath = `../formulas/${formula}/formula.json`
  if (fs.existsSync(resolvePath(formulaPath))) {
    const result = validateJsonFile(formulaPath)
    if (!result.valid) {
      // eslint-disable-next-line no-console
      console.error(
        `Error validating ${formulaPath}:`,
        result.errors.map((e: ValidationError) => e.message),
      )
      process.exit(1)
    }
  }
})
