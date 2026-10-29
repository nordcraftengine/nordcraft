import type { Component } from '@nordcraft/core/dist/index'
import { RESET_STYLES, theme as defaultTheme } from '@nordcraft/core/dist/index'
import type { ProjectFiles, ToddleProject } from '@nordcraft/ssr/dist/index'
import { splitRoutes } from '@nordcraft/ssr/dist/index'
import fs from 'node:fs'
import path from 'node:path'
import { createCustomCode, loadFixtures } from './fixtures/loader'

export const FIXTURE_PROJECT_ID = 'e2e'

const repoRoot = path.resolve(import.meta.dir, '../..')
const runtimeDistDir = path.join(repoRoot, 'packages/runtime/dist')

const RUNTIME_FILES = [
  'page.main.esm.js',
  'page.main.esm.js.map',
  'custom-element.main.esm.js',
]

const fixtureComponentName = (fixtureName: string, componentName: string) =>
  `${fixtureName}__${componentName}`

const renameComponentReferences = (
  value: unknown,
  componentNames: Map<string, string>,
): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => renameComponentReferences(item, componentNames))
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (
      record.type === 'path' &&
      Array.isArray(record.path) &&
      record.path[0] === 'Contexts' &&
      typeof record.path[1] === 'string'
    ) {
      return {
        ...record,
        path: [
          'Contexts',
          componentNames.get(record.path[1]) ?? record.path[1],
          ...record.path.slice(2),
        ],
      }
    }
    if (
      record.type === 'component' &&
      typeof record.name === 'string' &&
      !record.package
    ) {
      return {
        ...record,
        name: componentNames.get(record.name) ?? record.name,
      }
    }
    if (typeof record.contextProvider === 'string') {
      return {
        ...record,
        contextProvider:
          componentNames.get(record.contextProvider) ?? record.contextProvider,
      }
    }
    return Object.fromEntries(
      Object.entries(record).map(([key, item]) => [
        key,
        renameComponentReferences(item, componentNames),
      ]),
    )
  }
  return value
}

const renameComponent = (
  component: Component,
  componentNames: Map<string, string>,
): Component => {
  const renamed = renameComponentReferences(
    component,
    componentNames,
  ) as Component
  return {
    ...renamed,
    name: componentNames.get(component.name) ?? component.name,
    contexts: component.contexts
      ? Object.fromEntries(
          Object.entries(component.contexts).map(([provider, context]) => [
            componentNames.get(provider) ?? provider,
            context,
          ]),
        )
      : component.contexts,
  }
}

export const createFixtureProject = async () => {
  const fixtures = await loadFixtures()
  const components: Record<string, Component> = {}

  for (const [fixtureName, fixture] of fixtures) {
    const componentNames = new Map(
      fixture.components.map((component) => [
        component.name,
        fixtureComponentName(fixtureName, component.name),
      ]),
    )

    for (const component of fixture.components) {
      const renamed = renameComponent(component, componentNames)
      components[renamed.name] = renamed
    }

    const page = components[fixtureComponentName(fixtureName, fixture.page)]
    if (!page) {
      throw new Error(
        `Page "${fixture.page}" not found in fixture "${fixtureName}"`,
      )
    }

    // Each fixture gets its own route so that all fixtures can be served from
    // a single generated project, e.g. the backend Docker image.
    components[page.name] = {
      ...page,
      route: {
        ...page.route,
        path: [{ type: 'static', name: fixtureName }],
        query: page.route?.query ?? {},
      },
    }
  }

  const project: ToddleProject = {
    id: FIXTURE_PROJECT_ID,
    short_id: FIXTURE_PROJECT_ID,
    name: 'E2E Tests',
    type: 'app',
  }
  const files: ProjectFiles = {
    components,
    config: { theme: defaultTheme },
  }
  const fixtureProject = splitRoutes({
    branchName: 'main',
    files,
    project,
  })

  // Custom actions are provided as functions in the fixtures, so they cannot
  // be serialized by splitRoutes. Write the custom code used by the harness.
  for (const [fixtureName, fixture] of fixtures) {
    if (fixture.customActions) {
      fixtureProject.code[fixtureComponentName(fixtureName, fixture.page)] =
        createCustomCode(fixture)
    }
  }

  return fixtureProject
}

const toModule = (value: unknown) => `export default ${JSON.stringify(value)}`

const writeJavaScriptFile = (filePath: string, contents: string) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, contents)
}

export const writeFixtureProject = async (outputDir: string) => {
  const { project, routes, files, styles, code } = await createFixtureProject()

  fs.rmSync(outputDir, { recursive: true, force: true })
  writeJavaScriptFile(path.join(outputDir, 'project.js'), toModule(project))
  writeJavaScriptFile(path.join(outputDir, 'routes.js'), toModule(routes))

  for (const [name, file] of Object.entries(files)) {
    writeJavaScriptFile(
      path.join(outputDir, 'components', `${name.toLowerCase()}.js`),
      toModule(file),
    )
  }

  const staticDir = path.join(outputDir, 'assets/_static')
  for (const [name, stylesheet] of Object.entries(styles)) {
    writeJavaScriptFile(path.join(staticDir, `${name}.css`), stylesheet)
  }
  for (const [name, customCode] of Object.entries(code)) {
    writeJavaScriptFile(path.join(staticDir, `cc_${name}.js`), customCode)
  }

  for (const file of RUNTIME_FILES) {
    const source = path.join(runtimeDistDir, file)
    if (fs.existsSync(source)) {
      fs.mkdirSync(staticDir, { recursive: true })
      fs.copyFileSync(source, path.join(staticDir, file))
    }
  }
  if (!fs.existsSync(path.join(staticDir, 'page.main.esm.js'))) {
    throw new Error(
      `Runtime bundle not found in ${runtimeDistDir}. Run "bun run build" first.`,
    )
  }
  writeJavaScriptFile(path.join(staticDir, 'reset.css'), RESET_STYLES)

  return outputDir
}
