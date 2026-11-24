import type { Component, PageComponentsData } from '@nordcraft/core'
import { takeIncludedComponents } from '../components/utils'
import { processComponentApis } from '../rendering/api'
import { resolveClasses } from '../rendering/classes'
import { removeTestData } from '../rendering/testData'
import type { ProjectFiles, SsrFormulaHandler } from '../ssr.types'

export const getPageComponentsData = ({
  page,
  files,
  projectId,
  branchName = 'main',
  commit = 'unknown',
}: {
  page: Component
  files: ProjectFiles<SsrFormulaHandler>
  projectId: string
  branchName?: string
  commit?: string
}): PageComponentsData => {
  const processedPage = processComponentApis(page, files)
  const includedComponents = takeIncludedComponents({
    root: processedPage,
    projectComponents: files.components,
    packages: files.packages,
    includeRoot: false,
  }).map((component) => processComponentApis(component, files))
  const resolveComponentClasses = resolveClasses()

  return {
    project: projectId,
    branch: branchName,
    commit,
    component: resolveComponentClasses(removeTestData(processedPage)),
    components: includedComponents.map((component) =>
      resolveComponentClasses(removeTestData(component)),
    ),
  }
}
