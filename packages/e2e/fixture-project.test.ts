import { describe, expect, it } from 'bun:test'
import { createFixtureProject } from './fixture-project'
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
})
