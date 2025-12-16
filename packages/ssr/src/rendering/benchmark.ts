import { readFileSync } from 'fs'
import type { ProjectFiles } from '../ssr.types'
import { removeTestData } from './testData'
const project: { files: ProjectFiles } = JSON.parse(
  readFileSync('./testProject.json', 'utf-8'),
)
const formatNumber = (num: number) =>
  Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(num)
const getSize = (obj: unknown) => new Blob([JSON.stringify(obj)]).size
const totalSizeBefore = getSize(project.files.components)
let totalSize = 0
const reductions: Record<string, { before: number; after: number }> = {}
Object.entries(project.files.components).forEach(
  ([_componentKey, component]) => {
    const beforeSize = getSize(component)
    const cleanedUpComponent = removeTestData(component!)
    const afterSize = getSize(cleanedUpComponent)
    totalSize += afterSize
    reductions[component!.name] = {
      before: beforeSize,
      after: afterSize,
    }
  },
)
console.log('Reductions per component:')
Object.entries(reductions)
  .toSorted(([_aName, aSizes], [_bName, bSizes]) => {
    // Sort by relative change in percentage
    const aReductionPercent = (aSizes.before - aSizes.after) / aSizes.before
    const bReductionPercent = (bSizes.before - bSizes.after) / bSizes.before
    return bReductionPercent - aReductionPercent
  })
  .forEach(([componentName, sizes]) => {
    const reduction = sizes.before - sizes.after
    const reductionPercent = ((reduction / sizes.before) * 100).toFixed(2)
    console.log(
      `- ${componentName}: Reduced by ${formatNumber(
        reduction,
      )} bytes (${reductionPercent}%)`,
    )
  })

console.log(
  `Total size of components before cleanup: ${formatNumber(totalSizeBefore)} bytes`,
)
console.log(
  `Total size of cleaned components: ${formatNumber(totalSize)} bytes (avg: ${formatNumber(totalSize / Object.keys(project.files.components).length)} bytes)`,
)
