import { isLegacyApi } from '@nordcraft/core/dist/api/api'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { ComponentAPINode, IssueRule } from '../../../types'
import { removeFromPathFix } from '../../../util/removeUnused.fix'

export const unknownApiServiceRule: IssueRule<
  {
    apiName: string
    serviceName: string
  },
  ComponentAPINode
> = {
  code: 'unknown api service',
  level: 'warning',
  category: 'Unknown Reference',
  nodeTypes: 'component-api',
  visit: (report, args) => {
    if (
      isLegacyApi(args.value) ||
      !isDefined(args.value.service) ||
      isDefined(args.files.services?.[args.value.service])
    ) {
      return
    }
    report({
      path: [...args.path, 'service'],
      info: {
        title: 'Unknown Service',
        description: `**${args.value.service}** does not exist. The "${args.value.name}" API will not benefit from any information provided by the service. The service might have been deleted.`,
      },
      details: { apiName: args.value.name, serviceName: args.value.service },
      fixes: ['delete-api-service-reference'],
    })
  },
  fixes: {
    'delete-api-service-reference': removeFromPathFix,
  },
}

export type UnknownApiServiceRuleFix = 'delete-api-service-reference'
