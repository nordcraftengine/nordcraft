import crypto from 'crypto'
import fs from 'fs'

export interface BenchmarkStats {
  median: number
  iqr: number
  mean: number
}

export function computeSha256(filePath: string): string | null {
  try {
    const fileBuffer = fs.readFileSync(filePath)
    return crypto.createHash('sha256').update(fileBuffer).digest('hex')
  } catch {
    return null
  }
}

export function quantile(arr: number[], q: number) {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base])
  }
  return sorted[base]
}

export function median(arr: number[]) {
  return quantile(arr, 0.5)
}

export function mean(arr: number[]) {
  if (arr.length === 0) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

export function variance(arr: number[], m: number) {
  if (arr.length <= 1) return 0
  return arr.reduce((sum, x) => sum + Math.pow(x - m, 2), 0) / (arr.length - 1)
}

export function bootstrapCi(base: number[], head: number[], iterations = 1000) {
  const diffs: number[] = []
  const nBase = base.length
  const nHead = head.length

  for (let i = 0; i < iterations; i++) {
    const sampleBase: number[] = []
    for (let j = 0; j < nBase; j++) {
      sampleBase.push(base[Math.floor(Math.random() * nBase)])
    }
    const sampleHead: number[] = []
    for (let j = 0; j < nHead; j++) {
      sampleHead.push(head[Math.floor(Math.random() * nHead)])
    }

    const medBase = median(sampleBase)
    const medHead = median(sampleHead)
    const pct = ((medHead - medBase) / medBase) * 100
    diffs.push(pct)
  }

  diffs.sort((a, b) => a - b)
  return {
    low: diffs[Math.floor(iterations * 0.025)],
    high: diffs[Math.floor(iterations * 0.975)],
  }
}

export function normalCdf(x: number) {
  const b1 = 0.31938153
  const b2 = -0.356563782
  const b3 = 1.781477937
  const b4 = -1.821255978
  const b5 = 1.330274429
  const p = 0.2316419
  const c = 0.39894228

  if (x >= 0) {
    const t = 1.0 / (1.0 + p * x)
    return (
      1.0 -
      c *
        Math.exp((-x * x) / 2.0) *
        t *
        (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1)
    )
  }
  const t = 1.0 / (1.0 - p * x)
  return (
    c *
    Math.exp((-x * x) / 2.0) *
    t *
    (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1)
  )
}

export function welchTTest(base: number[], head: number[]) {
  const m1 = mean(base)
  const m2 = mean(head)
  const v1 = variance(base, m1)
  const v2 = variance(head, m2)
  const n1 = base.length
  const n2 = head.length

  const se = Math.sqrt(v1 / n1 + v2 / n2)
  if (se === 0) return 1.0

  const t = Math.abs((m2 - m1) / se)
  const p = 2 * (1 - normalCdf(t))
  return p
}

export function formatKb(kb: number): string {
  if (Math.abs(kb) >= 1024) {
    return `${(kb / 1024).toFixed(2)} MB`
  }
  return `${kb.toFixed(1)} KB`
}

export interface TimeVerdictInput {
  isByteIdentical: boolean
  deltaPercent: number
  deltaMs: number
  noiseThresholdPercent: number
  maxRegressionPercent: number
  maxRegressionMs: number
  pValue: number
  ci: { low: number; high: number }
}

export function evaluateTimeVerdict({
  isByteIdentical,
  deltaPercent,
  deltaMs,
  noiseThresholdPercent,
  maxRegressionPercent,
  maxRegressionMs,
  pValue,
  ci,
}: TimeVerdictInput) {
  if (isByteIdentical) {
    return {
      status: '1:1' as const,
      verdict: '🟢 1:1 (Identical code)',
    }
  }

  if (
    Math.abs(deltaPercent) <= noiseThresholdPercent ||
    pValue > 0.05 ||
    (ci.low <= 0 && ci.high >= 0)
  ) {
    return {
      status: '1:1' as const,
      verdict: '🟢 1:1',
    }
  }

  if (
    deltaPercent > maxRegressionPercent &&
    deltaMs > maxRegressionMs &&
    pValue < 0.01
  ) {
    return {
      status: 'regression' as const,
      verdict: `⚠️ +${deltaPercent.toFixed(1)}% Regression`,
    }
  }

  if (deltaPercent < -maxRegressionPercent && pValue < 0.01) {
    return {
      status: 'improvement' as const,
      verdict: `🚀 ${Math.abs(deltaPercent).toFixed(1)}% Faster`,
    }
  }

  return {
    status: 'stable' as const,
    verdict: '🟢 Stable',
  }
}

export const evaluateVerdict = evaluateTimeVerdict
export type VerdictInput = TimeVerdictInput

export interface HeapVerdictInput {
  isByteIdentical: boolean
  deltaHeapPercent: number
  deltaHeapKb: number
  noiseThresholdPercent?: number
}

export function evaluateHeapVerdict({
  isByteIdentical,
  deltaHeapPercent,
  deltaHeapKb,
  noiseThresholdPercent = 1.5,
}: HeapVerdictInput) {
  if (isByteIdentical) {
    return {
      status: '1:1' as const,
      verdict: '🟢 1:1 (Identical code)',
    }
  }

  if (
    Math.abs(deltaHeapPercent) <= noiseThresholdPercent ||
    Math.abs(deltaHeapKb) <= 30
  ) {
    return {
      status: '1:1' as const,
      verdict: '🟢 1:1',
    }
  }

  if (deltaHeapPercent > 3.0 && deltaHeapKb > 50) {
    return {
      status: 'regression' as const,
      verdict: `⚠️ +${deltaHeapPercent.toFixed(1)}% (+${formatKb(deltaHeapKb)})`,
    }
  }

  if (deltaHeapPercent < -3.0 && deltaHeapKb < -50) {
    return {
      status: 'improvement' as const,
      verdict: `💾 ${deltaHeapPercent.toFixed(1)}% (${formatKb(deltaHeapKb)})`,
    }
  }

  return {
    status: 'stable' as const,
    verdict: '🟢 Stable',
  }
}
