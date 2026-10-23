import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { describe, expect, test } from 'bun:test'
import {
  diffProjectFiles,
  patchProjectFiles,
  updateProjectFiles,
} from './projectFiles'

describe('diffProjectFiles', () => {
  const files: ProjectFiles = {
    components: {
      MyComp: {
        name: 'MyComp',
        nodes: {},
      },
    },
  }

  test('describes added values', () => {
    expect(diffProjectFiles(files, files)).toBeUndefined()
    expect(
      diffProjectFiles(files, {
        ...files,
        components: {
          ...files.components,
          OtherComp: { name: 'OtherComp', nodes: {} },
        },
      }),
    ).toEqual({
      components: {
        OtherComp: [{ name: 'OtherComp', nodes: {} }],
      },
    })
  })

  test('describes removed and changed values', () => {
    expect(
      diffProjectFiles(
        {
          ...files,
          components: { MyComp: { ...files.components.MyComp, name: 'Old' } },
        },
        { components: {} },
      ),
    ).toEqual({ components: { MyComp: [0, 0, 0] } })
  })
})

describe('patchProjectFiles', () => {
  const files: ProjectFiles = {
    components: {
      MyComp: {
        name: 'MyComp',
        nodes: {},
      },
    },
  }

  test('applies added, changed and removed values', () => {
    const prevFiles: ProjectFiles = {
      components: {
        MyComp: { ...files.components.MyComp, name: 'Old' },
        RemovedComp: { name: 'RemovedComp', nodes: {} },
      },
      themes: {},
    }
    const nextFiles: ProjectFiles = {
      components: {
        MyComp: files.components.MyComp,
        AddedComp: { name: 'AddedComp', nodes: {} },
      },
    }
    expect(
      patchProjectFiles(prevFiles, diffProjectFiles(prevFiles, nextFiles)),
    ).toEqual(nextFiles)
  })
})

describe('updateProjectFiles', () => {
  const files: ProjectFiles = {
    components: {
      MyComp: {
        name: 'MyComp',
        nodes: {},
      },
    },
  }

  test('returns the files from the message', () => {
    expect(updateProjectFiles({ files })).toBe(files)
  })

  test('returns undefined without files or changes', () => {
    expect(updateProjectFiles({})).toBeUndefined()
    expect(
      updateProjectFiles({ patch: diffProjectFiles(files, files) }),
    ).toBeUndefined()
  })

  test('returns the files last received when the message contains no changes', () => {
    expect(updateProjectFiles({}, files)).toBe(files)
  })

  test('applies changes to the files last received', () => {
    const nextFiles: ProjectFiles = {
      components: {
        MyComp: { name: 'RenamedComp', nodes: {} },
      },
    }
    expect(
      updateProjectFiles(
        { patch: diffProjectFiles(files, nextFiles) },
        structuredClone(files),
      ),
    ).toEqual(nextFiles)
  })

  test('applies changes to files included in the same message', () => {
    const nextFiles: ProjectFiles = {
      components: {
        MyComp: { name: 'RenamedComp', nodes: {} },
      },
    }
    expect(
      updateProjectFiles({ files, patch: diffProjectFiles(files, nextFiles) }),
    ).toEqual(nextFiles)
  })
})
