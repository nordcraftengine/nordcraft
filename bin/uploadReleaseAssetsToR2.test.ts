import { describe, expect, test } from 'bun:test'
import fs from 'fs'
import os from 'os'
import path from 'path'
import {
  getR2UploadTargets,
  RELEASE_ASSETS,
  uploadFileToR2,
  uploadReleaseAssetsToR2,
} from './uploadReleaseAssetsToR2'

describe('uploadReleaseAssetsToR2', () => {
  describe('getR2UploadTargets', () => {
    test('generates version and latest targets for each release asset with default options', () => {
      const targets = getR2UploadTargets('1.2.3', { distDir: '/fake/dist' })
      expect(targets).toHaveLength(RELEASE_ASSETS.length * 2)

      expect(targets).toEqual([
        {
          filePath: '/fake/dist/elements.json',
          destination: 'public/editor/1.2.3/elements.json',
        },
        {
          filePath: '/fake/dist/elements.json',
          destination: 'public/editor/latest/elements.json',
        },
        {
          filePath: '/fake/dist/interfaces.json',
          destination: 'public/editor/1.2.3/interfaces.json',
        },
        {
          filePath: '/fake/dist/interfaces.json',
          destination: 'public/editor/latest/interfaces.json',
        },
        {
          filePath: '/fake/dist/css-property-keywords.json',
          destination: 'public/editor/1.2.3/css-property-keywords.json',
        },
        {
          filePath: '/fake/dist/css-property-keywords.json',
          destination: 'public/editor/latest/css-property-keywords.json',
        },
      ])
    })

    test('supports custom bucket and prefix', () => {
      const targets = getR2UploadTargets('2.0.0', {
        bucket: 'my-assets',
        prefix: 'custom-prefix',
        distDir: '/custom/dist',
      })

      expect(targets[0]).toEqual({
        filePath: '/custom/dist/elements.json',
        destination: 'my-assets/custom-prefix/2.0.0/elements.json',
      })
      expect(targets[1]).toEqual({
        filePath: '/custom/dist/elements.json',
        destination: 'my-assets/custom-prefix/latest/elements.json',
      })
    })
  })

  describe('uploadFileToR2', () => {
    test('invokes wrangler with expected arguments', () => {
      let executedCommand: {
        command: string
        args: string[]
        options?: { stdio: 'inherit' }
      } | null = null

      const mockExec = (
        command: string,
        args: string[],
        options: { stdio: 'inherit' },
      ) => {
        executedCommand = { command, args, options }
        return { status: 0 }
      }

      uploadFileToR2(
        'public/editor/latest/elements.json',
        '/path/to/elements.json',
        mockExec,
      )

      expect(executedCommand).not.toBeNull()
      expect(executedCommand?.command).toBe('bunx')
      expect(executedCommand?.args).toEqual([
        'wrangler',
        'r2',
        'object',
        'put',
        'public/editor/latest/elements.json',
        '--file=/path/to/elements.json',
        '--remote',
      ])
    })

    test('throws an error when wrangler execution fails', () => {
      const failingExec = () => ({ status: 1 })

      expect(() =>
        uploadFileToR2(
          'public/editor/latest/elements.json',
          '/path/to/elements.json',
          failingExec,
        ),
      ).toThrow(
        'Failed to upload /path/to/elements.json to public/editor/latest/elements.json',
      )
    })
  })

  describe('uploadReleaseAssetsToR2 workflow', () => {
    test('throws if release version is invalid', () => {
      expect(() => uploadReleaseAssetsToR2('')).toThrow(
        'A valid release version is required',
      )
      expect(() => uploadReleaseAssetsToR2('   ')).toThrow(
        'A valid release version is required',
      )
    })

    test('throws if an asset file is missing in dist directory', () => {
      const emptyTmpDir = fs.mkdtempSync(
        path.join(os.tmpdir(), 'r2-upload-test-empty-'),
      )
      try {
        expect(() =>
          uploadReleaseAssetsToR2('1.0.0', { distDir: emptyTmpDir }),
        ).toThrow('Asset file not found')
      } finally {
        fs.rmSync(emptyTmpDir, { recursive: true, force: true })
      }
    })

    test('uploads all assets to versioned and latest paths when files exist', () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'r2-upload-test-'))
      try {
        for (const file of RELEASE_ASSETS) {
          fs.writeFileSync(path.join(tmpDir, file), '{}')
        }

        const uploaded: Array<{ destination: string; filePath: string }> = []
        const mockUploader = (destination: string, filePath: string) => {
          uploaded.push({ destination, filePath })
        }

        uploadReleaseAssetsToR2('1.0.0', {
          distDir: tmpDir,
          uploader: mockUploader,
        })

        expect(uploaded).toHaveLength(RELEASE_ASSETS.length * 2)
        expect(uploaded.map((u) => u.destination)).toEqual([
          'public/editor/1.0.0/elements.json',
          'public/editor/latest/elements.json',
          'public/editor/1.0.0/interfaces.json',
          'public/editor/latest/interfaces.json',
          'public/editor/1.0.0/css-property-keywords.json',
          'public/editor/latest/css-property-keywords.json',
        ])
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true })
      }
    })
  })
})
