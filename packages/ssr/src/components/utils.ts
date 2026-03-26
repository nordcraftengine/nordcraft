import type {
  Component,
  NodeModel,
} from '@nordcraft/core/dist/component/component.types'
import type { Nullable } from '@nordcraft/core/dist/types'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { ProjectFiles } from '../ssr.types'

export function takeIncludedComponents({
  root,
  projectComponents,
  packages = {},
  includeRoot = true,
}: {
  projectComponents: ProjectFiles['components']
  packages: ProjectFiles['packages']
  root: Component
  includeRoot?: Nullable<boolean>
}) {
  const components = {
    ...projectComponents,
    // Join the project components with all package components
    ...Object.fromEntries(
      Object.values(packages).flatMap((installedPackage) =>
        installedPackage
          ? Object.values(installedPackage.components).map((component) => [
              `${installedPackage.manifest.name}/${component!.name}`,
              component,
            ])
          : [],
      ),
    ),
  }
  const includedComponents = []
  if (includeRoot) {
    includedComponents.push(root)
  }
  includedComponents.push(...takeComponentsIncludedInProject(root, components))
  return includedComponents
}

function takeComponentsIncludedInProject(
  parent: Component,
  components: Partial<Record<string, Component>>,
) {
  const dependencies = new Map<string, Component>()
  const visitNode = (node: NodeModel, packageName?: Nullable<string>) => {
    if (node.type !== 'component') {
      return
    }
    const nodeName = [node.package ?? packageName, node.name]
      .filter(isDefined)
      .join('/')
    if (dependencies.has(nodeName)) {
      return
    }
    const component = components[nodeName]
    if (!isDefined(component)) {
      return
    }

    // Only add known/existing dependencies
    if (Object.hasOwn(components, nodeName)) {
      dependencies.set(nodeName, { ...component, name: nodeName })
    }

    Object.values(component.nodes ?? {}).forEach((node) =>
      visitNode(
        node,
        (node.type === 'component' ? node.package : undefined) ?? packageName,
      ),
    )
  }

  Object.values(parent.nodes ?? {}).forEach((node) =>
    visitNode(node, node.type === 'component' ? node.package : undefined),
  )

  return Array.from(dependencies.values())
}
