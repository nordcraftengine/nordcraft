/* eslint-disable no-console */
import type { ChildProcess } from 'node:child_process'
import { spawn, spawnSync } from 'node:child_process'
import path from 'node:path'
import { writeFixtureProject } from './fixture-project'
import { FIXTURE_ROUTES_ENV } from './fixtures/constants'
import { loadFixtures } from './fixtures/loader'

const image = process.env.E2E_DOCKER_IMAGE ?? 'nordcraft-backend'
const port = Number(process.env.E2E_PORT ?? 4174)
const fixtureDir = path.join(import.meta.dir, '.fixtures-dist')
const containerName = `nordcraft-e2e-${process.pid}`
const baseUrl = `http://127.0.0.1:${port}`

let docker: ChildProcess | undefined
let tests: ChildProcess | undefined

const run = (command: string, args: string[]) =>
  spawnSync(command, args, { stdio: 'ignore' })

const removeContainer = () => {
  run('docker', ['rm', '-f', containerName])
}

const cleanup = () => {
  removeContainer()
  docker?.kill('SIGTERM')
  tests?.kill('SIGTERM')
}

process.on('SIGINT', () => {
  cleanup()
  process.exit(130)
})
process.on('SIGTERM', () => {
  cleanup()
  process.exit(143)
})

const fail = (message: string): never => {
  cleanup()
  console.error(message)
  process.exit(1)
}

if (run('docker', ['info']).status !== 0) {
  fail('Docker is not available. Start Docker and try again.')
}

if (run('docker', ['image', 'inspect', image]).status !== 0) {
  fail(
    `Docker image "${image}" not found. Build it with "cd packages/backend && bun run docker:build".`,
  )
}

await writeFixtureProject(fixtureDir)
const healthFixture =
  (await loadFixtures()).keys().next().value ??
  fail('No fixtures found to run against the backend')
const healthPath = `/${encodeURIComponent(healthFixture)}`
removeContainer()

const waitForBackend = async (isExited: () => boolean) => {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (isExited()) {
      throw new Error('Backend container exited before it became ready')
    }
    try {
      const response = await fetch(`${baseUrl}${healthPath}`)
      if (response.ok) {
        return
      }
    } catch {
      // The container is still starting up
    }
    await Bun.sleep(500)
  }
  throw new Error(`Timed out waiting for the backend at ${baseUrl}`)
}

try {
  docker = spawn(
    'docker',
    [
      'run',
      '--rm',
      '--name',
      containerName,
      '-p',
      `${port}:3000`,
      '-e',
      'PORT=3000',
      '-v',
      `${fixtureDir}:/fixtures:ro`,
      '--entrypoint',
      '/app/nordcraft-backend',
      '-w',
      '/fixtures',
      image,
    ],
    { stdio: ['ignore', 'inherit', 'inherit'] },
  )

  let dockerExited = false
  docker.on('error', (error) => {
    dockerExited = true
    console.error(`Failed to start backend container: ${error.message}`)
  })
  docker.on('exit', (code) => {
    dockerExited = true
    if (code !== 0 && code !== null) {
      console.error(`Backend container exited with code ${code}`)
    }
  })

  await waitForBackend(() => dockerExited)

  tests = spawn(
    'bunx',
    ['playwright', 'test', '--config', 'playwright.config.ts'],
    {
      env: {
        ...process.env,
        E2E_EXTERNAL_SERVER: '1',
        [FIXTURE_ROUTES_ENV]: '1',
        E2E_PORT: String(port),
      },
      stdio: 'inherit',
    },
  )

  const exitCode = await new Promise<number | null>((resolve, reject) => {
    tests?.on('error', reject)
    tests?.on('close', resolve)
  })
  cleanup()
  process.exit(exitCode ?? 1)
} catch (error) {
  cleanup()
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
