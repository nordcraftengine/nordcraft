import type { FormulaHandlerV2 } from '@nordcraft/core'
import type {
  ProjectFiles,
  ProjectFilesWithCustomCode,
  ToddleProject,
} from '@nordcraft/ssr'
import { generateComponentFile, splitRoutes } from '@nordcraft/ssr'
import { describe, expect, test } from 'bun:test'
import { getConnInfo } from 'hono/bun'
import fs from 'node:fs'
import path from 'node:path'
import { getApp } from '../app'

describe('backend SSR project JS formula evaluation', () => {
  test('evaluates v2 project JS formulas from __project__/project.json via components/<name>.js during SSR', async () => {
    const projectJsonPath = path.resolve(
      import.meta.dir,
      '../../__project__/project.json',
    )
    const rawProject = JSON.parse(fs.readFileSync(projectJsonPath, 'utf8')) as {
      files: ProjectFiles
      project: ToddleProject
    }
    const { project, routes, files } = splitRoutes({
      branchName: 'main',
      files: rawProject.files,
      project: rawProject.project,
    })

    const tempDir = fs.mkdtempSync(
      path.join(import.meta.dir, '.tmp-component-module-'),
    )
    try {
      const homeFile = files['HomePage']
      if (!homeFile) {
        throw new Error('Expected HomePage in splitRoutes output')
      }
      const componentModulePath = path.join(tempDir, 'homepage.mjs')
      fs.writeFileSync(componentModulePath, generateComponentFile(homeFile))
      const loadedHomePage = (await import(componentModulePath))
        .default as ProjectFilesWithCustomCode<FormulaHandlerV2 | string>

      const app = getApp({
        getConnInfo,
        fileLoaders: [
          async (c, next) => {
            c.set('routes', routes)
            c.set('project', project.project)
            c.set('config', project.config)
            return next()
          },
        ],
        pageLoader: {
          loader: ({ name }) =>
            name === 'HomePage' ? loadedHomePage : files[name],
          urls: {
            pageStylesheetUrl: (name) => `/_static/${name}.css`,
            customCodeUrl: (name) => `/_static/cc_${name}.js`,
          },
        },
      })

      const res = await app.request('http://localhost/')
      const html = await res.text()
      const standardFormulaMatch = html.match(
        /<span[^>]*data-node-id="bUkvJ60vvTXHpWTqY-z7g"[^>]*>([^<]*)<\/span>/,
      )
      const jsFormulaMatch = html.match(
        /<span[^>]*data-node-id="lCgA10rmUvQnTvxZqCfjI"[^>]*>([^<]*)<\/span>/,
      )

      expect({
        status: res.status,
        standardFormulaNodeText: standardFormulaMatch?.[1],
        jsFormulaNodeText: jsFormulaMatch?.[1],
      }).toEqual({
        status: 200,
        standardFormulaNodeText: '42',
        jsFormulaNodeText: '24',
      })
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })
})
