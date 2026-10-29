import type { Component } from '@nordcraft/core/dist/index'
import type { PluginActionV2 } from '@nordcraft/core/dist/types'
import fs from 'node:fs'
import path from 'node:path'

export interface FixtureModule {
  page: string
  components: Component[]
  customActions?: Record<string, PluginActionV2>
}

export const loadFixtures = async (
  fixturesDir = import.meta.dir,
): Promise<Map<string, FixtureModule>> => {
  const fixtureFiles = fs
    .readdirSync(fixturesDir)
    .filter((file) => file.endsWith('.fixture.ts'))

  const fixtures = new Map<string, FixtureModule>()
  for (const file of fixtureFiles) {
    const fixturePath = path.join(fixturesDir, file)
    const mod = (await import(fixturePath)) as FixtureModule
    fixtures.set(file.replace('.fixture.ts', ''), mod)
  }
  return fixtures
}

export const createCustomCode = (fixture?: FixtureModule) => {
  const customActions = fixture?.customActions ?? {}

  const serializedActions = Object.entries(customActions)
    .map(
      ([name, action]) =>
        `"${name}": { arguments: ${JSON.stringify(action.arguments ?? [])}, handler: ${action.handler.toString()} }`,
    )
    .join(',\n')

  return `
export const project = "e2e";
export const loadCustomCode = () => {};
export const formulas = {};
export const actions = {
  e2e: {
    ${serializedActions}
  }
};
`
}
