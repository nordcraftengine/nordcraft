import { isLegacyApi } from '@nordcraft/core/dist/api/api'
import type { Rule } from '../../../types'
import { removeFromPathFix } from '../../../util/removeUnused.fix'

export const noReferenceApiServiceRule: Rule<{ serviceName: string }> = {
  code: 'no-reference api service',
  level: 'warning',
  category: 'No References',
  visit: (report, args) => {
    if (args.nodeType !== 'api-service') {
      return
    }
    const { value, memo, path } = args
    const serviceName = path.at(-1)
    if (typeof serviceName !== 'string') {
      return
    }

    const apiServiceReferences = memo(`apiServiceReferences`, () => {
      const usedServices = new Set<string>()
      Object.values(args.files.components).forEach((component) => {
        if (!component) {
          return
        }
        Object.values(component.apis ?? {}).forEach((api) => {
          if (!isLegacyApi(api) && typeof api.service === 'string') {
            usedServices.add(api.service)
          }
        })
      })
      return usedServices
    })
    if (apiServiceReferences.has(value.name)) {
      return
    }
    report(args.path, { serviceName }, ['delete-api-service'])
  },
  fixes: {
    'delete-api-service': removeFromPathFix,
  },
}

export type NoReferenceApiServiceRuleFix = 'delete-api-service'
