import crypto from 'crypto'
import fs from 'fs'

export interface BenchmarkStats {
  median: number
  iqr: number
  mean: number
}

export const MIN_TIMING_SAMPLES = 2

export const isUsableTimingSample = (value: number) =>
  Number.isFinite(value) && value > 0

export const hasUsableTimingSamples = (values: readonly number[]) =>
  values.length >= MIN_TIMING_SAMPLES && values.every(isUsableTimingSample)

/**
 * Creates a small deterministic pseudo-random generator for bootstrap
 * sampling. Keeping the seed in the report makes repeated comparisons
 * reproducible while still resampling the observed distributions.
 */
export function createSeededRandom(seed: number) {
  let state = Number.isFinite(seed) ? Math.trunc(seed) >>> 0 : 0
  return () => {
    state = (Math.imul(1_664_525, state) + 1_013_904_223) >>> 0
    return state / 0x1_0000_0000
  }
}

/**
 * Calculates a relative difference. A zero baseline has no defined
 * percentage, so callers receive NaN and must treat the result as
 * inconclusive rather than turning it into a false 0% delta.
 */
export function percentageDelta(base: number, head: number) {
  return base === 0 ? Number.NaN : ((head - base) / base) * 100
}

export function computeSha256(filePath: string): string | null {
  try {
    const fileBuffer = fs.readFileSync(filePath)
    return crypto.createHash('sha256').update(fileBuffer).digest('hex')
  } catch {
    return null
  }
}

/**
 * Computes the q-th quantile of an array of numbers.
 * @param arr - The array of numbers.
 * @param q - The quantile to compute (between 0 and 1).
 * @returns The q-th quantile value.
 */
export function quantile(arr: readonly number[], q: number) {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  if (base + 1 < sorted.length) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base])
  }
  return sorted[base]
}

/**
 * Computes the median of an array of numbers.
 * @param arr - The array of numbers.
 * @returns The median value.
 */
export function median(arr: readonly number[]) {
  return quantile(arr, 0.5)
}

/**
 * Computes the mean (average) of an array of numbers.
 * @param arr - The array of numbers.
 * @returns The mean value.
 */
export function mean(arr: readonly number[]) {
  if (arr.length === 0) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

/**
 * Computes the variance of an array of numbers.
 * @param arr - The array of numbers.
 * @param m - The mean of the array.
 * @returns The variance value.
 */
export function variance(arr: readonly number[], m: number) {
  if (arr.length <= 1) return 0
  return arr.reduce((sum, x) => sum + Math.pow(x - m, 2), 0) / (arr.length - 1)
}

export const hasInformativeTimingSamples = (values: readonly number[]) => {
  if (!hasUsableTimingSamples(values)) {
    return false
  }
  return variance(values, mean(values)) > 0
}

export interface BootstrapOptions {
  iterations?: number
  seed?: number
  random?: () => number
}

/**
 * Computes the bootstrap confidence interval for the difference in medians
 * between two arrays of numbers.
 */
export function bootstrapCi(
  base: readonly number[],
  head: readonly number[],
  optionsOrIterations: number | BootstrapOptions = 1000,
) {
  const iterations =
    typeof optionsOrIterations === 'number'
      ? optionsOrIterations
      : (optionsOrIterations.iterations ?? 1000)
  const random =
    typeof optionsOrIterations === 'number'
      ? createSeededRandom(0)
      : (optionsOrIterations.random ??
        createSeededRandom(optionsOrIterations.seed ?? 0))

  if (base.length === 0 || head.length === 0) {
    return { low: 0, high: 0 }
  }
  if (
    !Number.isFinite(iterations) ||
    iterations < 1 ||
    !base.every(isUsableTimingSample) ||
    !head.every(isUsableTimingSample)
  ) {
    return { low: Number.NaN, high: Number.NaN }
  }

  const sampleCount = Math.max(1, Math.floor(iterations))
  const diffs: number[] = []
  const nBase = base.length
  const nHead = head.length

  for (let i = 0; i < sampleCount; i++) {
    const sampleBase: number[] = []
    for (let j = 0; j < nBase; j++) {
      const randomValue = random()
      const index = Number.isFinite(randomValue)
        ? Math.min(nBase - 1, Math.max(0, Math.floor(randomValue * nBase)))
        : 0
      sampleBase.push(base[index] ?? 0)
    }
    const sampleHead: number[] = []
    for (let j = 0; j < nHead; j++) {
      const randomValue = random()
      const index = Number.isFinite(randomValue)
        ? Math.min(nHead - 1, Math.max(0, Math.floor(randomValue * nHead)))
        : 0
      sampleHead.push(head[index] ?? 0)
    }

    const medBase = median(sampleBase)
    const medHead = median(sampleHead)
    diffs.push(percentageDelta(medBase, medHead))
  }

  diffs.sort((a, b) => a - b)
  return {
    low: diffs[Math.min(sampleCount - 1, Math.floor(sampleCount * 0.025))],
    high: diffs[Math.min(sampleCount - 1, Math.floor(sampleCount * 0.975))],
  }
}

/**
 * Computes the cumulative distribution function (CDF) of the standard normal distribution at a given value.
 * @param x - The value at which to evaluate the CDF.
 * @returns The probability that a standard normal random variable is less than or equal to x.
 */
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

const logGammaCoefficients = [
  676.5203681218851, -1259.1392167224028, 771.32342877765313,
  -176.61502916214059, 12.507343278686905, -0.13857109526572012,
  9.9843695780195716e-6, 1.5056327351493116e-7,
]

const logGamma = (value: number): number => {
  if (value < 0.5) {
    return (
      Math.log(Math.PI) -
      Math.log(Math.sin(Math.PI * value)) -
      logGamma(1 - value)
    )
  }

  const z = value - 1
  let sum = 0.9999999999998099
  for (let index = 0; index < logGammaCoefficients.length; index++) {
    sum += logGammaCoefficients[index] / (z + index + 1)
  }
  const t = z + logGammaCoefficients.length - 0.5
  return 0.9189385332046727 + (z + 0.5) * Math.log(t) - t + Math.log(sum)
}

const incompleteBetaContinuedFraction = (a: number, b: number, x: number) => {
  const logBeta = logGamma(a) + logGamma(b) - logGamma(a + b)
  const front = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - logBeta) / a
  let result = 1
  let c = 1
  let d = 0

  for (let iteration = 0; iteration <= 200; iteration++) {
    const m = Math.floor(iteration / 2)
    const numerator =
      iteration === 0
        ? 1
        : iteration % 2 === 0
          ? (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m))
          : (-(a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1))

    d = 1 + numerator * d
    if (Math.abs(d) < 1e-30) d = 1e-30
    d = 1 / d
    c = 1 + numerator / c
    if (Math.abs(c) < 1e-30) c = 1e-30

    const delta = c * d
    result *= delta
    if (Math.abs(1 - delta) < 3e-14) break
  }

  return front * (result - 1)
}

const regularizedIncompleteBeta = (x: number, a: number, b: number): number => {
  if (x <= 0) return 0
  if (x >= 1) return 1
  if (x > (a + 1) / (a + b + 2)) {
    return 1 - regularizedIncompleteBeta(1 - x, b, a)
  }
  return Math.min(1, Math.max(0, incompleteBetaContinuedFraction(a, b, x)))
}

export function studentTCdf(value: number, degreesOfFreedom: number) {
  if (!Number.isFinite(value) || !Number.isFinite(degreesOfFreedom)) {
    return Number.NaN
  }
  if (degreesOfFreedom <= 0) return Number.NaN
  if (value === 0) return 0.5

  const absoluteValue = Math.abs(value)
  const x =
    degreesOfFreedom / (degreesOfFreedom + absoluteValue * absoluteValue)
  const positiveCdf =
    1 - 0.5 * regularizedIncompleteBeta(x, degreesOfFreedom / 2, 0.5)
  return value > 0 ? positiveCdf : 1 - positiveCdf
}

/**
 * Performs Welch's t-test to compare the means of two arrays of numbers.
 * @param base - The base array of numbers.
 * @param head - The head array of numbers.
 * @returns The p-value from Welch's t-test.
 */
export function welchTTest(base: readonly number[], head: readonly number[]) {
  if (
    base.length < 2 ||
    head.length < 2 ||
    !base.every(isUsableTimingSample) ||
    !head.every(isUsableTimingSample)
  ) {
    return 1.0
  }

  const m1 = mean(base)
  const m2 = mean(head)
  const v1 = variance(base, m1)
  const v2 = variance(head, m2)
  const n1 = base.length
  const n2 = head.length
  const baseVarianceTerm = v1 / n1
  const headVarianceTerm = v2 / n2
  const standardErrorSquared = baseVarianceTerm + headVarianceTerm

  if (v1 === 0 || v2 === 0) {
    return 1.0
  }
  if (!Number.isFinite(standardErrorSquared) || standardErrorSquared <= 0) {
    return 1.0
  }

  const t = Math.abs((m2 - m1) / Math.sqrt(standardErrorSquared))
  const degreesOfFreedom =
    (standardErrorSquared * standardErrorSquared) /
    ((baseVarianceTerm * baseVarianceTerm) / (n1 - 1) +
      (headVarianceTerm * headVarianceTerm) / (n2 - 1))

  if (!Number.isFinite(degreesOfFreedom) || degreesOfFreedom <= 0) {
    return 1.0
  }

  const p = 2 * (1 - studentTCdf(t, degreesOfFreedom))
  return Number.isFinite(p) ? Math.min(1, Math.max(0, p)) : 1.0
}

export function formatKb(kb: number): string {
  if (Math.abs(kb) >= 1024) {
    return `${(kb / 1024).toFixed(2)} MB`
  }
  return `${kb.toFixed(1)} KB`
}

export function formatMs(value: number) {
  return Number.isFinite(value) ? `${value.toFixed(2)} ms` : 'n/a'
}

export function formatPercent(value: number) {
  return Number.isFinite(value)
    ? `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
    : 'n/a'
}

export interface TimeVerdictInput {
  isByteIdentical: boolean
  isAATest?: boolean
  deltaPercent: number
  deltaMs: number
  noiseThresholdPercent: number
  maxRegressionPercent: number
  maxRegressionMs: number
  pValue: number
  ci: { low: number; high: number }
}

/**
 * Evaluates the time verdict based on various performance metrics.
 * @param param0 - The input object containing various metrics for evaluating the time verdict.
 * @returns An object containing the status and verdict based on the evaluation.
 */
export function evaluateTimeVerdict({
  isByteIdentical,
  isAATest = false,
  deltaPercent,
  deltaMs,
  noiseThresholdPercent,
  maxRegressionPercent,
  maxRegressionMs,
  pValue,
  ci,
}: TimeVerdictInput) {
  if (
    !Number.isFinite(deltaPercent) ||
    !Number.isFinite(deltaMs) ||
    !Number.isFinite(pValue) ||
    !Number.isFinite(ci.low) ||
    !Number.isFinite(ci.high)
  ) {
    return {
      status: 'inconclusive' as const,
      verdict: '⚪ Inconclusive (invalid samples)',
    }
  }

  if (isAATest) {
    return {
      status: '1:1' as const,
      verdict: '🟢 1:1 (A/A mode)',
    }
  }

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

export type BenchmarkTimeStatus =
  | '1:1'
  | 'improvement'
  | 'regression'
  | 'stable'
  | 'inconclusive'

export interface TimeBenchmarkResult {
  baseTimes: readonly number[]
  headTimes: readonly number[]
  baseMedianMs: number
  headMedianMs: number
  baseIqrMs: number
  headIqrMs: number
  deltaMs: number
  deltaPercent: number
  ciLowPercent: number
  ciHighPercent: number
  pValue: number
  bootstrapIterations: number
  bootstrapSeed: number
  timeStatus: BenchmarkTimeStatus
  timeVerdict: string
}

/**
 * Summarizes a pair of time samples and evaluates whether the head is
 * equivalent to, faster than, or slower than the base.
 *
 * Keeping the statistical aggregation next to the verdict logic makes it
 * possible for all benchmark runners to use the same decision criteria.
 */
export function summarizeTimeBenchmark({
  baseTimes,
  headTimes,
  isByteIdentical = false,
  isAATest = false,
  noiseThresholdPercent,
  maxRegressionPercent,
  maxRegressionMs,
  bootstrapIterations = 1000,
  bootstrapSeed = 0,
}: {
  baseTimes: readonly number[]
  headTimes: readonly number[]
  isByteIdentical?: boolean
  isAATest?: boolean
  noiseThresholdPercent: number
  maxRegressionPercent: number
  maxRegressionMs: number
  bootstrapIterations?: number
  bootstrapSeed?: number
}) {
  const baseMedianMs = median(baseTimes)
  const headMedianMs = median(headTimes)
  const baseIqrMs = quantile(baseTimes, 0.75) - quantile(baseTimes, 0.25)
  const headIqrMs = quantile(headTimes, 0.75) - quantile(headTimes, 0.25)
  const samplesUsable =
    hasInformativeTimingSamples(baseTimes) &&
    hasInformativeTimingSamples(headTimes)
  const deltaMs = samplesUsable ? headMedianMs - baseMedianMs : Number.NaN
  const deltaPercent = samplesUsable
    ? percentageDelta(baseMedianMs, headMedianMs)
    : Number.NaN
  const resolvedBootstrapIterations =
    Number.isFinite(bootstrapIterations) && bootstrapIterations >= 1
      ? Math.floor(bootstrapIterations)
      : 1000
  const resolvedBootstrapSeed = Number.isFinite(bootstrapSeed)
    ? bootstrapSeed
    : 0
  const ci = bootstrapCi(baseTimes, headTimes, {
    iterations: resolvedBootstrapIterations,
    seed: resolvedBootstrapSeed,
  })
  const pValue = welchTTest(baseTimes, headTimes)
  const verdict = evaluateTimeVerdict({
    isByteIdentical,
    isAATest,
    deltaPercent,
    deltaMs,
    noiseThresholdPercent,
    maxRegressionPercent,
    maxRegressionMs,
    pValue,
    ci,
  })

  return {
    baseTimes: [...baseTimes],
    headTimes: [...headTimes],
    baseMedianMs,
    headMedianMs,
    baseIqrMs,
    headIqrMs,
    deltaMs,
    deltaPercent,
    ciLowPercent: ci.low,
    ciHighPercent: ci.high,
    pValue,
    bootstrapIterations: resolvedBootstrapIterations,
    bootstrapSeed: resolvedBootstrapSeed,
    timeStatus: verdict.status,
    timeVerdict: verdict.verdict,
  } satisfies TimeBenchmarkResult
}

export const evaluateVerdict = evaluateTimeVerdict
export type VerdictInput = TimeVerdictInput

export interface HeapVerdictInput {
  isByteIdentical: boolean
  deltaHeapPercent: number
  deltaHeapKb: number
  noiseThresholdPercent?: number
}

/**
 * Evaluates the heap verdict based on various performance metrics.
 * @param param0 - The input object containing various metrics for evaluating the heap verdict.
 * @returns An object containing the status and verdict based on the evaluation.
 */
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
