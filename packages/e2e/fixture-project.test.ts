import { describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  createFixtureProject,
  renameComponentReferences,
  writeFixtureProject,
} from './fixture-project'
import { loadFixtures } from './fixtures/loader'

describe('fixture project', () => {
  it('creates a route for every fixture', async () => {
    const fixtures = await loadFixtures()
    const { routes } = await createFixtureProject()

    const fixtureRouteNames = Object.values(routes.pages)
      .map((page) => page.route.path[0]?.name)
      .sort()

    expect(fixtureRouteNames).toEqual([...fixtures.keys()].sort())
  })

  it('creates a component file for every page', async () => {
    const { routes, files } = await createFixtureProject()

    for (const page of Object.values(routes.pages)) {
      expect(files[page.name]).toBeDefined()
    }
  })

  it('generates custom code for fixtures with custom actions', async () => {
    const { routes, code } = await createFixtureProject()
    const page = Object.values(routes.pages).find((candidate) =>
      candidate.name.endsWith('__CustomActionsPage'),
    )

    expect(page).toBeDefined()
    expect(code[page?.name ?? '']).toContain('calculateHash')
    expect(code[page?.name ?? '']).toContain('triggerLifecycle')
  })

  it('recursively renames nested references inside component nodes', () => {
    const componentNames = new Map([
      ['MyChild', 'fixture__MyChild'],
      ['MyProvider', 'fixture__MyProvider'],
    ])
    const node = {
      type: 'component',
      name: 'MyChild',
      attrs: {
        title: {
          type: 'path',
          path: ['Contexts', 'MyProvider', 'title'],
        },
      },
    }

    const renamed = renameComponentReferences(
      node,
      componentNames,
    ) as typeof node

    expect(renamed.name).toBe('fixture__MyChild')
    expect(renamed.attrs.title.path).toEqual([
      'Contexts',
      'fixture__MyProvider',
      'title',
    ])
  })

  it('recursively renames nested references inside contextProvider actions', () => {
    const componentNames = new Map([
      ['ProviderA', 'fixture__ProviderA'],
      ['ProviderB', 'fixture__ProviderB'],
    ])
    const action = {
      type: 'TriggerWorkflow',
      workflow: 'submit',
      contextProvider: 'ProviderA',
      parameters: {
        data: {
          formula: {
            type: 'path',
            path: ['Contexts', 'ProviderB', 'value'],
          },
        },
      },
    }

    const renamed = renameComponentReferences(
      action,
      componentNames,
    ) as typeof action

    expect(renamed.contextProvider).toBe('fixture__ProviderA')
    expect(renamed.parameters.data.formula.path).toEqual([
      'Contexts',
      'fixture__ProviderB',
      'value',
    ])
  })

  it('writes static components_<page>.json files for every page', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nc-fixture-proj-'))
    try {
      await writeFixtureProject(tmpDir)
      const { routes } = await createFixtureProject()
      const firstPageName = Object.values(routes.pages)[0]?.name
      if (!firstPageName) {
        throw new Error('Expected at least one page')
      }
      const jsonPath = path.join(
        tmpDir,
        'assets/_static',
        `components_${firstPageName}.json`,
      )
      const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as {
        project: string
        branch: string
        commit: string
        component: { name: string }
        components: Array<{ name: string }>
      }
      expect({
        exists: fs.existsSync(jsonPath),
        project: parsed.project,
        branch: parsed.branch,
        commit: parsed.commit,
        componentName: parsed.component.name,
        hasComponentsArray: Array.isArray(parsed.components),
      }).toEqual({
        exists: true,
        project: 'e2e',
        branch: 'main',
        commit: 'unknown',
        componentName: firstPageName,
        hasComponentsArray: true,
      })
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })
})
