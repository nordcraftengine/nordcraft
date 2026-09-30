/* eslint-disable no-console */
import { spawnSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const RELEASE_ASSETS = [
  'elements.json',
  'interfaces.json',
  'css-property-keywords.json',
] as const

export const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable'
export const LATEST_CACHE_CONTROL = 'public, max-age=21600'
export const JSON_CONTENT_TYPE = 'application/json'

export const getR2UploadTargets = (
  version: string,
  options?: {
    bucket?: string
    prefix?: string
    distDir?: string
    versionCacheControl?: string
    latestCacheControl?: string
  },
) => {
  const bucket = options?.bucket ?? process.env.R2_BUCKET_NAME ?? 'public'
  const prefix = options?.prefix ?? 'editor'
  const dist = options?.distDir ?? path.resolve(__dirname, '../dist')
  const versionCacheControl =
    options?.versionCacheControl ?? IMMUTABLE_CACHE_CONTROL
  const latestCacheControl = options?.latestCacheControl ?? LATEST_CACHE_CONTROL

  return RELEASE_ASSETS.flatMap((filename) => {
    const filePath = path.resolve(dist, filename)
    return [
      {
        filePath,
        destination: `${bucket}/${prefix}/${version}/${filename}`,
        contentType: JSON_CONTENT_TYPE,
        cacheControl: versionCacheControl,
      },
      {
        filePath,
        destination: `${bucket}/${prefix}/latest/${filename}`,
        contentType: JSON_CONTENT_TYPE,
        cacheControl: latestCacheControl,
      },
    ]
  })
}

export const uploadFileToR2 = (
  destination: string,
  filePath: string,
  options?: {
    contentType?: string
    cacheControl?: string
    exec?: (
      command: string,
      args: string[],
      options: { stdio: 'inherit' },
    ) => { status: number | null }
  },
) => {
  const exec = options?.exec ?? spawnSync
  const args = [
    'wrangler',
    'r2',
    'object',
    'put',
    destination,
    `--file=${filePath}`,
    '--remote',
  ]

  if (options?.contentType) {
    args.push(`--content-type=${options.contentType}`)
  }

  if (options?.cacheControl) {
    args.push(`--cache-control=${options.cacheControl}`)
  }

  const result = exec('bunx', args, { stdio: 'inherit' })

  if (result.status !== 0) {
    throw new Error(`Failed to upload ${filePath} to ${destination}`)
  }
}

export const uploadReleaseAssetsToR2 = (
  version: string,
  options?: {
    bucket?: string
    prefix?: string
    distDir?: string
    versionCacheControl?: string
    latestCacheControl?: string
    uploader?: (
      destination: string,
      filePath: string,
      metadata?: { contentType?: string; cacheControl?: string },
    ) => void
  },
) => {
  if (!version || typeof version !== 'string' || !version.trim()) {
    throw new Error('A valid release version is required')
  }

  const normalizedVersion = version.trim()
  const uploader = options?.uploader ?? uploadFileToR2
  const targets = getR2UploadTargets(normalizedVersion, options)

  for (const { filePath } of targets) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Asset file not found: ${filePath}`)
    }
  }

  for (const { filePath, destination, contentType, cacheControl } of targets) {
    console.log(
      `Uploading ${filePath} -> ${destination} (Content-Type: ${contentType}, Cache-Control: ${cacheControl})`,
    )
    uploader(destination, filePath, { contentType, cacheControl })
  }
}

if (import.meta.main) {
  const args = process.argv.slice(2)
  if (args.length !== 1 || !args[0]?.trim()) {
    console.error('Usage: bun bin/uploadReleaseAssetsToR2.ts <version>')
    process.exit(1)
  }

  const version = args[0].trim()
  try {
    uploadReleaseAssetsToR2(version)
    console.log(`Successfully uploaded release assets for ${version} to R2!`)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}
