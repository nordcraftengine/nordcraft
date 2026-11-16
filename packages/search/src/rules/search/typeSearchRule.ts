import { isDefined } from '@nordcraft/core'
import type { NodeType } from '../../types'
import type { TypeFilterToken } from '../../util/parseSearchQuery'

export function getNodeTypesForTypeFilter(
  token: TypeFilterToken,
): NodeType['nodeType'][] {
  switch (token.value) {
    case 'page':
    case 'component':
      return ['component']
    case 'element':
    case 'component-instance':
    case 'text':
    case 'text-node':
    case 'slot':
    case 'node':
    case 'component-node':
      return ['component-node']
    case 'workflow':
    case 'component-workflow':
      return ['component-workflow']
    case 'action':
      return ['action-model', 'project-action']
    case 'action-model':
      return ['action-model']
    case 'project-action':
      return ['project-action']
    case 'var':
    case 'variable':
    case 'component-variable':
      return ['component-variable']
    case 'attr':
    case 'attribute':
      return ['component-attribute', 'component-node-attribute']
    case 'component-attribute':
      return ['component-attribute']
    case 'component-node-attribute':
      return ['component-node-attribute']
    case 'event':
    case 'component-event':
      return ['component-event']
    case 'api':
    case 'component-api':
      return ['component-api']
    case 'component-api-input':
      return ['component-api-input']
    case 'service':
    case 'api-service':
      return ['api-service']
    case 'route':
    case 'project-route':
      return ['project-route']
    case 'theme':
      return ['project-theme', 'project-theme-property']
    case 'project-theme':
      return ['project-theme']
    case 'project-theme-property':
      return ['project-theme-property']
    case 'package':
    case 'project-package':
      return ['project-package']
    case 'style':
    case 'style-declaration':
      return ['style-declaration']
    case 'variant':
    case 'style-variant':
      return ['style-variant']
    case 'style-variable':
      return ['style-variable']
    case 'custom-property':
      return ['custom-property']
    case 'animation':
      return ['animation']
    case 'context':
    case 'component-context':
      return ['component-context']
    case 'formula':
      return ['formula']
    case 'component-formula':
      return ['component-formula']
    case 'project-formula':
      return ['project-formula']
    case 'project-config':
      return ['project-config']
    case 'action-custom-model-argument':
      return ['action-custom-model-argument']
    case 'action-custom-model-event':
      return ['action-custom-model-event']
    default:
      return []
  }
}

export function matchTypeFilter(
  data: NodeType,
  token: TypeFilterToken,
): boolean {
  switch (token.value) {
    case 'page':
      return data.nodeType === 'component' && isDefined(data.value.route)
    case 'element':
      return (
        data.nodeType === 'component-node' && data.value?.type === 'element'
      )
    case 'component-instance':
      return (
        data.nodeType === 'component-node' && data.value?.type === 'component'
      )
    case 'text':
    case 'text-node':
      return data.nodeType === 'component-node' && data.value?.type === 'text'
    case 'slot':
      return data.nodeType === 'component-node' && data.value?.type === 'slot'
    case 'node':
      return data.nodeType === 'component-node'
    case 'workflow':
      return data.nodeType === 'component-workflow'
    case 'action':
      return (
        data.nodeType === 'action-model' || data.nodeType === 'project-action'
      )
    case 'var':
    case 'variable':
      return data.nodeType === 'component-variable'
    case 'attr':
    case 'attribute':
      return (
        data.nodeType === 'component-attribute' ||
        data.nodeType === 'component-node-attribute'
      )
    case 'event':
      return data.nodeType === 'component-event'
    case 'api':
      return data.nodeType === 'component-api'
    case 'service':
      return data.nodeType === 'api-service'
    case 'route':
      return data.nodeType === 'project-route'
    case 'theme':
      return (
        data.nodeType === 'project-theme' ||
        data.nodeType === 'project-theme-property'
      )
    case 'package':
      return data.nodeType === 'project-package'
    case 'style':
      return data.nodeType === 'style-declaration'
    case 'variant':
      return data.nodeType === 'style-variant'
    case 'context':
      return data.nodeType === 'component-context'
    default:
      return data.nodeType === token.value
  }
}
