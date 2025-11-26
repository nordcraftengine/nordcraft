import * as libFormulas from '../lib/dist/formulas'

// Register all core formulas globally for tests
{
  ;(globalThis as any).__CORE_FORMULAS__ = Object.fromEntries(
    Object.entries(libFormulas).map(([name, module]) => [
      '@toddle/' + name,
      (module as any).default as any,
    ]),
  )
}
