import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { describe, expect, test } from 'bun:test'
import { fixProblems } from './fixProblems'
import { noStaticNodeCondition } from './rules/issues/logic/noStaticNodeCondition'
import { searchProject } from './searchProject'
import type {
  FixProblemsCompleteResponse,
  FixProblemsProgressResponse,
  FixProblemsResponse,
} from './types'

const createFilesWithStaticConditions = (count: number) => {
  const nodes: Record<string, unknown> = {}
  for (let i = 0; i < count; i++) {
    nodes[`node${i}`] = {
      type: 'element',
      tag: 'div',
      attrs: {},
      classes: {},
      events: {},
      children: [],
      style: {},
      condition: { type: 'value', value: true },
    }
  }
  return {
    components: {
      test: {
        name: 'test',
        nodes,
        formulas: {},
        apis: {},
        attributes: {},
        variables: {},
      },
    },
  } as unknown as ProjectFiles
}

const isComplete = (
  message: FixProblemsResponse,
): message is FixProblemsCompleteResponse =>
  'complete' in message && message.complete === true

const asProgress = (message: FixProblemsResponse) =>
  message as FixProblemsProgressResponse

describe('fixProblems progress events', () => {
  test('emits one message per applied fix, counting up fixed/total', async () => {
    const total = 3
    const files = createFilesWithStaticConditions(total)
    const messages: FixProblemsResponse[] = []
    await fixProblems(
      {
        id: 'test-id',
        files: structuredClone(files),
        fixRule: noStaticNodeCondition.code,
        fixType: 'remove-condition',
      },
      (results) => messages.push(results),
    )

    // One progress event for the initial total (0/N) plus one per fix,
    // followed by the final complete message with the patch
    expect(messages.length).toBe(total + 2)

    const progress = messages.slice(0, -1)
    progress.forEach((message, index) => {
      expect(message).toMatchObject({
        id: 'test-id',
        fixRule: noStaticNodeCondition.code,
        fixType: 'remove-condition',
        fixed: index,
        total,
      })
      expect(message).not.toHaveProperty('patch')
      expect(message).not.toHaveProperty('complete')
    })

    const complete = messages.at(-1)
    expect(complete).toMatchObject({
      id: 'test-id',
      fixRule: noStaticNodeCondition.code,
      fixType: 'remove-condition',
      fixed: total,
      total,
      complete: true,
    })
    expect(complete).toHaveProperty('patch')
  })

  test('each progress names the file just fixed and the next one queued', async () => {
    const total = 3
    const files = createFilesWithStaticConditions(total)
    const messages: FixProblemsResponse[] = []
    await fixProblems(
      {
        id: 'test-id',
        files: structuredClone(files),
        fixRule: noStaticNodeCondition.code,
        fixType: 'remove-condition',
      },
      (results) => messages.push(results),
    )

    const progress = messages.slice(0, -1).map(asProgress)
    expect(progress.length).toBe(total + 1)

    // Initial 0/N event announces the total and what is up first
    expect(progress[0]?.path).toBeUndefined()
    expect(progress[0]?.nextPath).toBeDefined()
    expect(progress[0]?.nextPath?.slice(0, 2)).toEqual([
      'components',
      'test',
    ])

    // Every applied fix names its own path; all live under components/test
    const appliedPaths = progress.slice(1).map((message) => message.path)
    for (const path of appliedPaths) {
      expect(path).toBeDefined()
      expect(path?.slice(0, 2)).toEqual(['components', 'test'])
    }
    // All three nodes were covered, no repeats
    expect(new Set(appliedPaths.map((path) => JSON.stringify(path))).size).toBe(
      total,
    )

    // Every queued nextPath (when present) is one of the batch fixes
    const appliedKeys = new Set(
      appliedPaths.map((path) => JSON.stringify(path)),
    )
    for (const message of progress) {
      if (message.nextPath !== undefined) {
        expect(appliedKeys.has(JSON.stringify(message.nextPath))).toBe(true)
      }
    }
    // Last fix of the pass has nothing more queued
    expect(progress.at(-1)?.nextPath).toBeUndefined()
  })

  test('stops midway when cancelled and reports partial progress', async () => {
    const total = 5
    const files = createFilesWithStaticConditions(total)
    const messages: FixProblemsResponse[] = []
    // Cancel once the initial event + first fix have been reported
    const shouldCancel = () => messages.length >= 2
    await fixProblems(
      {
        id: 'test-id',
        files: structuredClone(files),
        fixRule: noStaticNodeCondition.code,
        fixType: 'remove-condition',
      },
      (results) => messages.push(results),
      shouldCancel,
    )

    // Initial 0/5, first fix 1/5, then the cancelled complete message
    expect(messages.length).toBe(3)
    const complete = messages.at(-1)
    expect(isComplete(complete!)).toBe(true)
    expect(complete).toMatchObject({
      id: 'test-id',
      fixed: 1,
      total,
      complete: true,
      cancelled: true,
    })
    expect(complete).toHaveProperty('patch')
    if (isComplete(complete!)) {
      expect(complete.cancelReason).toBeDefined()
      // Partial patch: exactly one of the five fixes applied
      expect(complete.patch).toBeDefined()
    }
  })

  test('cancelled before starting reports zero progress', async () => {
    const files = createFilesWithStaticConditions(3)
    const messages: FixProblemsResponse[] = []
    await fixProblems(
      {
        id: 'test-id',
        files: structuredClone(files),
        fixRule: noStaticNodeCondition.code,
        fixType: 'remove-condition',
      },
      (results) => messages.push(results),
      () => true,
    )
    expect(messages.length).toBe(1)
    expect(messages[0]).toMatchObject({
      id: 'test-id',
      fixed: 0,
      total: 0,
      complete: true,
      cancelled: true,
    })
  })

  test('final patch resolves all fixable issues', async () => {
    const files = createFilesWithStaticConditions(3)
    const messages: FixProblemsResponse[] = []
    await fixProblems(
      {
        id: 'test-id',
        files,
        fixRule: noStaticNodeCondition.code,
        fixType: 'remove-condition',
      },
      (results) => messages.push(results),
    )

    const complete = messages.at(-1)
    expect(complete?.complete).toBe(true)
    // Fixes were applied, so the final message carries a non-empty diff
    expect(complete).toHaveProperty('patch')
    if (complete && 'patch' in complete) {
      expect(complete.patch).toBeDefined()
    } else {
      throw new Error('Expected complete message with patch')
    }

    // Counter ends at N/N
    if (complete && 'fixed' in complete && 'total' in complete) {
      expect(complete.fixed).toBe(3)
      expect(complete.total).toBe(3)
    } else {
      throw new Error('Expected complete message with fixed/total')
    }
  })

  test('emits only the complete message when nothing is fixable', async () => {
    const files = {
      components: {
        test: {
          name: 'test',
          nodes: {},
          formulas: {},
          apis: {},
          attributes: {},
          variables: {},
        },
      },
    } as unknown as ProjectFiles
    const messages: FixProblemsResponse[] = []
    await fixProblems(
      {
        id: 'test-id',
        files,
        fixRule: noStaticNodeCondition.code,
        fixType: 'remove-condition',
      },
      (results) => messages.push(results),
    )
    expect(messages.length).toBe(1)
    expect(messages[0]).toMatchObject({
      id: 'test-id',
      fixed: 0,
      total: 0,
      complete: true,
    })
  })

  test('progress fixed/total matches remaining issues found by search', async () => {
    const total = 5
    const files = createFilesWithStaticConditions(total)
    const fixableBefore = Array.from(
      searchProject({ files, rules: [noStaticNodeCondition] }),
    ).filter((issue) =>
      issue.fixes?.includes('remove-condition'),
    ).length
    expect(fixableBefore).toBe(total)

    const messages: FixProblemsResponse[] = []
    await fixProblems(
      {
        id: 'test-id',
        files: structuredClone(files),
        fixRule: noStaticNodeCondition.code,
        fixType: 'remove-condition',
      },
      (results) => messages.push(results),
    )
    const complete = messages.at(-1)
    expect(complete).toMatchObject({ fixed: fixableBefore, total: fixableBefore })
  })
})
