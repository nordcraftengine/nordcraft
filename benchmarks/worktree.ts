/* eslint-disable no-console */
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
)

export const runCommand = (
  command: string[],
  options?: {
    cwd?: string
  },
) => {
  const result = Bun.spawnSync(command, {
    cwd: options?.cwd,
    stdout: 'inherit',
    stderr: 'inherit',
  })
  if (result.exitCode !== 0) {
    throw new Error(`Command failed (${result.exitCode}): ${command.join(' ')}`)
  }
}

/**
 * Copies the benchmark assets into a base worktree so the runner can measure
 * the base revision with the same fixtures and harness as the head.
 */
export const copyAssetsToWorktree = (
  worktree: string,
  assets: readonly string[],
) => {
  for (const asset of assets) {
    const source = resolve(repositoryRoot, asset)
    const destination = join(worktree, asset)
    mkdirSync(dirname(destination), { recursive: true })
    cpSync(source, destination)
  }
}

export const removeBenchmarkWorktree = (worktreePath: string) => {
  if (!existsSync(worktreePath)) {
    Bun.spawnSync(['git', 'worktree', 'prune'], {
      cwd: repositoryRoot,
      stdout: 'ignore',
      stderr: 'ignore',
    })
    return
  }

  const cleanupResult = Bun.spawnSync(
    ['git', 'worktree', 'remove', worktreePath, '--force'],
    {
      cwd: repositoryRoot,
      stdout: 'inherit',
      stderr: 'inherit',
    },
  )
  if (cleanupResult.exitCode !== 0) {
    console.warn(
      `Could not remove benchmark worktree cleanly; pruning stale registration for ${worktreePath}`,
    )
    Bun.spawnSync(['git', 'worktree', 'prune'], {
      cwd: repositoryRoot,
      stdout: 'ignore',
      stderr: 'ignore',
    })
  }
  rmSync(worktreePath, { recursive: true, force: true })
}
