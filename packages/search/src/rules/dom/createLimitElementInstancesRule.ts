import type {
  Component,
  NodeModel,
} from '@nordcraft/core/dist/component/component.types'
import { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { Level, Rule } from '../../types'

export function createLimitElementInstancesRule(
  tag: string,
  limit: number = 1,
  level: Level = 'warning',
): Rule<{
  tag: string
  limit: number
  instances: number
}> {
  return {
    code: 'limit element instances',
    level: level,
    category: 'SEO',
    visit: (report, { path, nodeType, value, files }) => {
      if (!(nodeType === 'component' && value.route)) {
        return
      }
      const page = new ToddleComponent({
        // Enforce that the component is not undefined since we're iterating
        component: value,
        getComponent: (name, packageName) =>
          packageName
            ? files.packages?.[packageName]?.components[name]
            : files.components[name],
        packageName: undefined,
        globalFormulas: {
          formulas: files.formulas,
          packages: files.packages,
        },
      })

      const visitedComponentMatches = new Map<string, number>()
      const visitNode = (
        node: NodeModel,
        packageName?: string,
        repeat: boolean = false,
      ): number => {
        if (node.type === 'element' && node.tag === tag) {
          return repeat ? 10 : 1
        }
        if (node.type !== 'component') {
          return 0
        }
        let component: Component | undefined
        let componentName: string
        if (node.package) {
          component = files.packages?.[node.package]?.components[node.name]
          componentName = `${node.package}/${node.name}`
        } else {
          component = files.components[node.name]
          componentName = node.name
        }
        if (!isDefined(component)) {
          return 0
        }
        if (visitedComponentMatches.has(componentName)) {
          return (
            (node.repeat ? 10 : 1) *
            (visitedComponentMatches.get(componentName) ?? 0)
          )
        }

        const tagMatches = Object.values(component.nodes).reduce(
          (acc, node) =>
            acc +
            visitNode(
              node,
              (node.type === 'component' ? node.package : undefined) ??
                packageName,
              isDefined(node.repeat),
            ),
          0,
        )
        visitedComponentMatches.set(componentName, tagMatches)
        return tagMatches
      }
      const tagMatches = Object.values(page.nodes).reduce(
        (acc, node) =>
          acc +
          visitNode(
            node,
            node.type === 'component' ? node.package : undefined,
            isDefined(node.repeat),
          ),
        0,
      )
      if (tagMatches > limit) {
        report(path, { tag, limit, instances: tagMatches })
      }
    },
  }
}
