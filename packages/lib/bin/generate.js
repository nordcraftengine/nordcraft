const fs = require('fs')

const parentDir = `${__dirname}/..`
const distPath = `${parentDir}/dist`

function load(type) {
  const res = {}

  const folders = fs
    .readdirSync(`${parentDir}/${type}s`)
    .filter((f) => f.includes('.') === false)

  fs.writeFileSync(
    `${parentDir}/${type}s.ts`,
    `${folders
      .map(
        (folder) => `import * as ${folder} from "./${type}s/${folder}/handler"`,
      )
      .join('\n')}

export {
  ${folders.join(',\n  ')}
}
  `,
  )

  for (const folder of folders) {
    const config = require(`../${type}s/${folder}/${type}.json`)
    res['@toddle/' + folder] = config
  }

  return res
}
fs.rmSync(distPath, { recursive: true, force: true })
fs.mkdirSync(distPath, { recursive: true })
const formulas = load('formula')
const actions = load('action')

// The lib.ts file is used by toddle internally to list all available formulas and actions
const libContent = `
    export const formulas = ${JSON.stringify(formulas, null, 2)};
    export const actions = ${JSON.stringify(actions, null, 2)};
`
fs.writeFileSync(`${distPath}/lib.ts`, libContent)
fs.writeFileSync(`${parentDir}/lib.ts`, libContent)
