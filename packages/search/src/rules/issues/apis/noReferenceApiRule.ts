import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { Rule } from '../../../types'
import { removeFromPathFix } from '../../../util/removeUnused.fix'

export const noReferenceApiRule: Rule<void> = {
  code: 'no-reference api',
  level: 'warning',
  category: 'No References',
  visit: (report, args) => {
    if (args.nodeType !== 'component-api') {
      return
    }
    const { value, memo, component } = args
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!component) {
      return
    }

    const componentApiReferences = memo(
      `componentApiReferences/${component.name}]`,
      () => {
        const usedApis = new Set<string>()
        for (const { formula, path } of component.formulasInComponent()) {
          const [
            apis,
            apiName,
            client,
            eventName,
            _actions,
            _actionIndex,
            ...remainingPath
          ] = path
          if (
            formula.type === 'path' &&
            formula.path[0] === 'Apis' &&
            typeof formula.path[1] === 'string'
          ) {
            usedApis.add(formula.path[1])
          } else if (
            // If an event is declared that references the API event's "Event"
            // then we consider that a reference to the API - even if it's
            // in a console log action or similar.
            formula.type === 'path' &&
            formula.path[0] === 'Event' &&
            typeof apis === 'string' &&
            apis.toLocaleLowerCase() === 'apis' &&
            typeof apiName === 'string' &&
            client === 'client' &&
            typeof eventName === 'string' &&
            ['onCompleted', 'onFailed', 'onMessage'].includes(eventName) &&
            // Event references in child actions should not count as API references
            isDefined(remainingPath) &&
            Array.isArray(remainingPath) &&
            !remainingPath.includes('actions')
          ) {
            usedApis.add(apiName)
          }
        }
        for (const [, action] of component.actionModelsInComponent()) {
          if (action.type === 'Fetch') {
            usedApis.add(action.api)
          }
        }
        return usedApis
      },
    )
    if (componentApiReferences.has(value.name)) {
      return
    }
    report({
      path: args.path,
      info: {
        title: 'Unused API',
        description: `**${value.name}** is never used in any formulas and is not called in any workflows. Consider removing it.`,
      },
      fixes: ['delete-api'],
    })
  },
  fixes: {
    'delete-api': removeFromPathFix,
  },
}

export type NoReferenceApiRuleFix = 'delete-api'
