import type {
  Component,
  ComponentNodeModel,
} from '@nordcraft/core/dist/component/component.types'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { MemoFn, Rule } from '../../../types'
import { contextlessEvaluateFormula } from '../../../util/contextlessEvaluateFormula'
import { removeFromPathFix } from '../../../util/removeUnused.fix'

export const noReferenceComponentRule: Rule<void> = {
  code: 'no-reference component',
  level: 'warning',
  category: 'No References',
  visit: (report, data, state) => {
    if (
      data.nodeType !== 'component' ||
      isPage(data.value) ||
      (state?.projectDetails?.type === 'package' &&
        data.value.exported === true) ||
      contextlessEvaluateFormula(data.value.customElement?.enabled).result ===
        true ||
      componentIsReferenced(data.files.components, data.memo)(data.value.name)
    ) {
      return
    }

    report(data.path, undefined, ['delete-component'])
  },
  fixes: {
    'delete-component': removeFromPathFix,
  },
}

export type NoReferenceComponentRuleFix = 'delete-component'

export const componentIsReferenced = (
  components: Partial<Record<string, Component>>,
  memo: MemoFn,
) => {
  const usedComponents = memo('all-used-components', () => {
    const used = new Set<string>()
    Object.values(components).forEach((component) => {
      Object.values(component?.nodes ?? {})
        .filter(
          (node) =>
            node.type === 'component' &&
            // Do not add cyclical references
            node.name !== component?.name,
        )
        .forEach((instance) => {
          used.add((instance as ComponentNodeModel).name)
        })
    })
    return used
  })

  return (componentName: string) => {
    return usedComponents.has(componentName)
  }
}

const isPage = (
  value: Component,
): value is Component & { route: Required<Component['route']> } =>
  isDefined(value.route)
