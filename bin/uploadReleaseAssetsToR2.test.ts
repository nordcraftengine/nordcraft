import { describe, expect, test } from 'bun:test'
import fs from 'fs'
import os from 'os'
import path from 'path'
import {
  getR2UploadTargets,
  IMMUTABLE_CACHE_CONTROL,
  isValidReleaseVersion,
  JSON_CONTENT_TYPE,
  LATEST_CACHE_CONTROL,
  RELEASE_ASSETS,
  uploadFileToR2,
  uploadReleaseAssetsToR2,
} from './uploadReleaseAssetsToR2'

describe('uploadReleaseAssetsToR2', () => {
  describe('isValidReleaseVersion', () => {
    test('accepts valid version formats', () => {
      expect(isValidReleaseVersion('latest')).toBe(true)
      expect(isValidReleaseVersion('1.0.0')).toBe(true)
      expect(isValidReleaseVersion('v1.0.0')).toBe(true)
      expect(isValidReleaseVersion('2.0.21')).toBe(true)
      expect(isValidReleaseVersion('v2.0.21')).toBe(true)
      expect(isValidReleaseVersion('1.2.3.4')).toBe(true)
      expect(isValidReleaseVersion('543c325')).toBe(true) // 7-char git sha
      expect(
        isValidReleaseVersion('543c325441ef328c7f8f4ffb2e20d5cc9a0edf66'),
      ).toBe(true) // 40-char git sha
    })

    test('rejects invalid version formats', () => {
      expect(isValidReleaseVersion('')).toBe(false)
      expect(isValidReleaseVersion('   ')).toBe(false)
      expect(isValidReleaseVersion('invalid')).toBe(false)
      expect(isValidReleaseVersion('1.2.3.alpha')).toBe(false)
      expect(isValidReleaseVersion('123')).toBe(false) // not latest, no dot, too short for sha
      expect(isValidReleaseVersion('123456')).toBe(false) // 6 chars (sha requires >= 7)
    })
  })
  describe('getR2UploadTargets', () => {
    test('generates version and latest targets for each release asset with default options', () => {
      const targets = getR2UploadTargets('1.2.3', { distDir: '/fake/dist' })
      expect(targets).toHaveLength(RELEASE_ASSETS.length * 2)

      expect(targets).toEqual([
        {
          filePath: '/fake/dist/elements.json',
          destination: 'public/editor/1.2.3/elements.json',
          contentType: JSON_CONTENT_TYPE,
          cacheControl: IMMUTABLE_CACHE_CONTROL,
        },
        {
          filePath: '/fake/dist/elements.json',
          destination: 'public/editor/latest/elements.json',
          contentType: JSON_CONTENT_TYPE,
          cacheControl: LATEST_CACHE_CONTROL,
        },
        {
          filePath: '/fake/dist/interfaces.json',
          destination: 'public/editor/1.2.3/interfaces.json',
          contentType: JSON_CONTENT_TYPE,
          cacheControl: IMMUTABLE_CACHE_CONTROL,
        },
        {
          filePath: '/fake/dist/interfaces.json',
          destination: 'public/editor/latest/interfaces.json',
          contentType: JSON_CONTENT_TYPE,
          cacheControl: LATEST_CACHE_CONTROL,
        },
        {
          filePath: '/fake/dist/css-property-keywords.json',
          destination: 'public/editor/1.2.3/css-property-keywords.json',
          contentType: JSON_CONTENT_TYPE,
          cacheControl: IMMUTABLE_CACHE_CONTROL,
        },
        {
          filePath: '/fake/dist/css-property-keywords.json',
          destination: 'public/editor/latest/css-property-keywords.json',
          contentType: JSON_CONTENT_TYPE,
          cacheControl: LATEST_CACHE_CONTROL,
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
        contentType: JSON_CONTENT_TYPE,
        cacheControl: IMMUTABLE_CACHE_CONTROL,
      })
      expect(targets[1]).toEqual({
        filePath: '/custom/dist/elements.json',
        destination: 'my-assets/custom-prefix/latest/elements.json',
        contentType: JSON_CONTENT_TYPE,
        cacheControl: LATEST_CACHE_CONTROL,
      })
    })
  })

  describe('uploadFileToR2', () => {
    test('invokes wrangler with expected arguments including content-type and cache-control', () => {
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
        {
          contentType: 'application/json',
          cacheControl: 'public, max-age=21600',
          exec: mockExec,
        },
      )

      expect(executedCommand).not.toBeNull()
      const captured = executedCommand as {
        command: string
        args: string[]
      } | null
      expect(captured?.command).toBe('bunx')
      expect(captured?.args).toEqual([
        'wrangler',
        'r2',
        'object',
        'put',
        'public/editor/latest/elements.json',
        '--file=/path/to/elements.json',
        '--remote',
        '--content-type=application/json',
        '--cache-control=public, max-age=21600',
      ])
    })

    test('throws an error when wrangler execution fails', () => {
      const failingExec = () => ({ status: 1 })

      expect(() =>
        uploadFileToR2(
          'public/editor/latest/elements.json',
          '/path/to/elements.json',
          { exec: failingExec },
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

        const uploaded: Array<{
          destination: string
          filePath: string
          metadata?: { contentType?: string; cacheControl?: string }
        }> = []
        const mockUploader = (
          destination: string,
          filePath: string,
          metadata?: { contentType?: string; cacheControl?: string },
        ) => {
          uploaded.push({ destination, filePath, metadata })
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
        expect(uploaded[0].metadata).toEqual({
          contentType: 'application/json',
          cacheControl: 'public, max-age=31536000, immutable',
        })
        expect(uploaded[1].metadata).toEqual({
          contentType: 'application/json',
          cacheControl: 'public, max-age=21600',
        })
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true })
      }
    })
  })
})
