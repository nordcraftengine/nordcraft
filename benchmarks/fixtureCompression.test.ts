import { describe, expect, test } from 'bun:test'

import type { ProjectFiles } from '../packages/ssr/dist/ssr.types'
import {
  compressBenchmarkProject,
  compressProjectFiles,
  measureProjectSerialization,
  parseFixtureMode,
  renderFixtureSerializationTable,
} from './fixtureCompression'

const createFiles = (): ProjectFiles =>
  ({
    components: {
      HomePage: {
        name: 'HomePage',
        nodes: {
          root: {
            type: 'text',
            value: 'Hello',
          },
        },
        attributes: {
          title: {
            testValue: 'editor-only test data that should not be shipped',
          },
        },
        workflows: {
          load: {
            name: 'load',
            testValue: 'a very long workflow test value',
            actions: [],
          },
        },
        events: [
          {
            dummyEvent: true,
            actions: [],
          },
        ],
        testScenarios: ['editor-only scenario'],
      },
    },
    packages: {
      shared: {
        manifest: { name: 'shared', commit: 'abc' },
        components: {
          card: {
            name: 'shared/Card',
            nodes: {
              label: {
                type: 'text',
                value: 'Card',
              },
            },
            attributes: {
              title: { testValue: 'package test data' },
            },
          },
        },
      },
    },
  }) as unknown as ProjectFiles

describe('compressProjectFiles', () => {
  test('strips test data from project and package components', () => {
    const files = createFiles()
    const compressed = compressProjectFiles(files)

    expect(JSON.stringify(files)).toContain('editor-only test data')
    expect(JSON.stringify(files)).toContain('package test data')
    expect(JSON.stringify(compressed)).not.toContain('testValue')
    expect(JSON.stringify(compressed)).not.toContain('dummyEvent')
    expect(compressed.components.HomePage).not.toBe(files.components.HomePage)
    expect(compressed.packages?.shared?.components.card).not.toBe(
      files.packages?.shared?.components.card,
    )
  })

  test('does not mutate the original project files', () => {
    const files = createFiles()
    const originalJson = JSON.stringify(files)

    compressProjectFiles(files)

    expect(JSON.stringify(files)).toBe(originalJson)
  })

  test('preserves fixture metadata when compressing a benchmark project', () => {
    const project = {
      name: 'benchmark',
      commit: 'abc',
      files: createFiles(),
    }

    const compressed = compressBenchmarkProject(project)

    expect(compressed.name).toBe(project.name)
    expect(compressed.commit).toBe(project.commit)
    expect(compressed.files).not.toBe(project.files)
    expect(JSON.stringify(compressed.files)).not.toContain('testValue')
  })
})

describe('measureProjectSerialization', () => {
  test('reports raw, compressed, and gzip payload savings', () => {
    const metrics = measureProjectSerialization(createFiles())

    expect(metrics.originalBytes).toBeGreaterThan(metrics.compressedBytes)
    expect(metrics.savedBytes).toBe(
      metrics.originalBytes - metrics.compressedBytes,
    )
    expect(metrics.reductionPercent).toBeGreaterThan(0)
    expect(metrics.originalGzipBytes).toBeGreaterThan(
      metrics.compressedGzipBytes,
    )
    expect(metrics.gzipSavedBytes).toBe(
      metrics.originalGzipBytes - metrics.compressedGzipBytes,
    )
    expect(metrics.gzipReductionPercent).toBeGreaterThan(0)
  })

  test('formats the payload table for benchmark reports', () => {
    const table = renderFixtureSerializationTable([
      {
        id: 'benchmark-project',
        ...measureProjectSerialization(createFiles()),
      },
    ])

    expect(table[0]).toContain('Raw JSON')
    expect(table[2]).toContain('**benchmark-project**')
    expect(table[2]).toContain('%')
    expect(table[2]).toContain('B')
  })
})

describe('parseFixtureMode', () => {
  test('defaults to raw fixtures', () => {
    expect(parseFixtureMode(new Map())).toBe('raw')
  })

  test('accepts compressed fixtures and rejects unknown modes', () => {
    expect(parseFixtureMode(new Map([['--fixtures', 'compressed']]))).toBe(
      'compressed',
    )
    expect(() =>
      parseFixtureMode(new Map([['--fixtures', 'sanitized']])),
    ).toThrow('--fixtures must be one of: raw, compressed')
  })
})
