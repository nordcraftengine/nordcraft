import type { CustomActionModel } from '@nordcraft/core/dist/component/component.types'
import { isFormula } from '@nordcraft/core/dist/formula/formula'
import { valueFormula } from '@nordcraft/core/dist/formula/formulaUtils'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { ActionModelNode, FixFunction } from '../../../types'

export const upgradeCustomAction: FixFunction<
  ActionModelNode<CustomActionModel>
> = ({ data: { path, value, files } }) => {
  const referencedAction = (
    value.package ? files.packages?.[value.package]?.actions : files.actions
  )?.[value.name]
  const definitionArgs = referencedAction?.arguments ?? []

  const currentArguments = value.arguments?.filter(isDefined) ?? []
  let newArguments = currentArguments
  let convertedData = false

  // Legacy `data` fallback: if no arguments are provided but `data` is set,
  // map it to the first argument of the referenced action (if known).
  // This mirrors the fallback in `handleAction.ts` where legacy actions
  // evaluate `[action.data]` when `arguments` is missing.
  if (currentArguments.length === 0 && isDefined(value.data)) {
    const dataFormula = isFormula(value.data)
      ? value.data
      : valueFormula(
          value.data as string | number | boolean | null | object | undefined,
        )
    const firstArgName = definitionArgs[0]?.name
    if (typeof firstArgName === 'string') {
      newArguments = [{ name: firstArgName, formula: dataFormula }]
      convertedData = true
    }
  } else if (definitionArgs.length > 0 && newArguments.length > 0) {
    // Legacy actions receive arguments positionally, while v2 actions
    // receive them by name (see `handleAction.ts`). Remap names by index
    // so the upgraded action keeps working.
    newArguments = newArguments.map((arg, index) => {
      const definitionName = definitionArgs[index]?.name
      if (typeof definitionName === 'string' && arg.name !== definitionName) {
        return { ...arg, name: definitionName }
      }
      return arg
    })
  }

  const { data: _omittedData, ...rest } = value
  const newAction: CustomActionModel = {
    ...rest,
    type: 'Custom',
    version: 2,
    arguments: newArguments,
    // Only drop `data` when we successfully converted it to arguments.
    // Otherwise keep it to avoid data loss (the new runtime ignores it,
    // but keeping it preserves the original value for manual migration).
    ...(convertedData || !isDefined(value.data) ? {} : { data: value.data }),
  }
  void _omittedData
  return { path, value: newAction }
}
