import { writeFileSync } from 'fs'
import { createGenerator, type Config } from 'ts-json-schema-generator'

const config: Config = {
  path: './dist/component/component.types.d.ts',
  type: 'Component',
  additionalProperties: true,
}

const schema = createGenerator(config).createSchema(config.type)
writeFileSync(
  'src/component/schemas/component.schema.json',
  JSON.stringify(schema, null, 2),
)
