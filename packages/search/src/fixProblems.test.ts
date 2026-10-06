import { create } from 'jsondiffpatch'
import { describe, expect, test } from 'bun:test'
import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { fixProblems } from './fixProblems'
import { invalidStyleSyntaxRule } from './rules/issues/style/invalidStyleSyntaxRule'
import { searchProject } from './searchProject'
import type { FixProblemsResponse } from './types'

const filesWithInvalidStyles = (): ProjectFiles => ({
  themes: {
    Default: {
      fonts: [],
      propertyDefinitions: {},
    },
  },
  formulas: {},
  components: {
    test: {
      name: 'test',
      nodes: {
        root: {
          tag: 'div',
          type: 'element',
          attrs: {},
          style: {
            gap: '8px',
            'max-width': 'calc(NOT VALID',
            '{': '100px',
            '}': '50px',
          },
          events: {},
          classes: {},
          children: [],
        },
      },
      formulas: {},
      apis: {},
      attributes: {},
      variables: {},
    },
  },
})

const remainingIssues = (files: ProjectFiles) =>
  Array.from(
    searchProject({ files, rules: [invalidStyleSyntaxRule] }),
  ).length

describe('fixProblems progress events', () => {
  test('emits progress per fix and a complete message with all fixes applied', async () => {
    const files = filesWithInvalidStyles()
    expect(remainingIssues(files)).toBe(3)

    const messages: FixProblemsResponse[] = []
    await fixProblems(
      {
        id: 'fix-1',
        files,
        fixRule: invalidStyleSyntaxRule.code,
        fixType: 'delete-style-property',
      },
      (message) => {
        messages.push(message)
      },
    )

    // Initial total + one progress event per applied fix
    expect(messages.slice(0, -1)).toMatchObject([
      { fixed: 0, total: 3 },
      { fixed: 1, total: 3 },
      { fixed: 2, total: 3 },
      { fixed: 3, total: 3 },
    ])
    const complete = messages[messages.length - 1]
    expect(complete).toMatchObject({
      complete: true,
      fixed: 3,
      total: 3,
    })
    expect('patch' in complete).toBe(true)

    // The patch actually resolves every issue (single-fix parity)
    const jsonDiffPatch = create({ omitRemovedValues: true })
    const updated = jsonDiffPatch.patch(
      structuredClone(files),
      (complete as { patch: unknown }).patch as never,
    ) as ProjectFiles
    expect(remainingIssues(updated)).toBe(0)
  })

  test('cancel stops early with a partial complete message', async () => {
    const files = filesWithInvalidStyles()
    const messages: FixProblemsResponse[] = []
    // Cancel after the initial total + first applied fix
    const shouldCancel = () => messages.length >= 2
    await fixProblems(
      {
        id: 'fix-2',
        files,
        fixRule: invalidStyleSyntaxRule.code,
        fixType: 'delete-style-property',
      },
      (message) => {
        messages.push(message)
      },
      shouldCancel,
    )

    const complete = messages[messages.length - 1]
    expect(complete).toMatchObject({
      complete: true,
      cancelled: true,
      fixed: 1,
      total: 3,
    })
  })

  test('fixes more than 100 issues in one run (no fix limit)', async () => {
    const files = filesWithInvalidStyles()
    const root = files.components.test?.nodes?.root as {
      style: Record<string, string>
    }
    // 150 invalid declarations - the old max-100 cap would stop at 100
    root.style = Object.fromEntries(
      Array.from({ length: 150 }, (_, index) => [`{${index}`, '100px']),
    )
    expect(remainingIssues(files)).toBe(150)

    const messages: FixProblemsResponse[] = []
    await fixProblems(
      {
        id: 'fix-many',
        files,
        fixRule: invalidStyleSyntaxRule.code,
        fixType: 'delete-style-property',
      },
      (message) => {
        messages.push(message)
      },
    )

    const complete = messages[messages.length - 1]
    expect(complete).toMatchObject({
      complete: true,
      fixed: 150,
      total: 150,
    })
  })

  test('no fixable issues sends only the complete message', async () => {
    const files = filesWithInvalidStyles()
    // All styles already valid - nothing for the rule to fix
    const root = files.components.test?.nodes?.root as {
      style: Record<string, string>
    }
    root.style = { gap: '8px', width: '100%' }
    expect(remainingIssues(files)).toBe(0)

    const messages: FixProblemsResponse[] = []
    await fixProblems(
      {
        id: 'fix-3',
        files,
        fixRule: invalidStyleSyntaxRule.code,
        fixType: 'delete-style-property',
      },
      (message) => {
        messages.push(message)
      },
    )
    expect(messages).toHaveLength(1)
    expect(messages[0]).toMatchObject({
      complete: true,
      fixed: 0,
      total: 0,
    })
  })
})
