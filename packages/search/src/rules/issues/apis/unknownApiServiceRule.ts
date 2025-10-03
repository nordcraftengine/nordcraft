import { isLegacyApi } from '@nordcraft/core/dist/api/api'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { Rule } from '../../../types'
import { removeFromPathFix } from '../../../util/removeUnused.fix'

export const unknownApiServiceRule: Rule<{
  apiName: string
  serviceName: string
}> = {
  code: 'unknown api service',
  level: 'warning',
  category: 'Unknown Reference',
  visit: (report, args) => {
    if (
      args.nodeType !== 'component-api' ||
      isLegacyApi(args.value) ||
      !isDefined(args.value.service) ||
      isDefined(args.files.services?.[args.value.service])
    ) {
      return
    }
    report(
      [...args.path, 'service'],
      { apiName: args.value.name, serviceName: args.value.service },
      ['delete-api-service-reference'],
    )
  },
  fixes: {
    'delete-api-service-reference': removeFromPathFix,
  },
}

export type UnknownApiServiceRuleFix = 'delete-api-service-reference'
