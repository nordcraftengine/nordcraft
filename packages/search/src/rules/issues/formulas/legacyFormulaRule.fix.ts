import type {
  AndOperation,
  ArrayOperation,
  FunctionOperation,
  OrOperation,
  SwitchOperation,
} from '@nordcraft/core/dist/formula/formula'
import { omitKeys } from '@nordcraft/core/dist/utils/collections'
import type { FixFunction, FormulaNode } from '../../../types'
import {
  ARRAY_ARGUMENT_MAPPINGS,
  PREDICATE_ARGUMENT_MAPPINGS,
  renameArguments,
} from '../../../util/helpers'

export const replaceLegacyFormula: FixFunction<
  FormulaNode<FunctionOperation>
> = ({ data }) => {
  switch (data.value.name) {
    // Known legacy formulas first
    case 'AND': {
      const { name, ...legacyAndFormula } = data.value
      const andFormula: AndOperation = {
        ...legacyAndFormula,
        type: 'and',
        arguments: (legacyAndFormula.arguments ?? []).map((a) => {
          const { name, ...argument } = a
          return argument
        }),
      }
      return { path: data.path, value: andFormula }
    }
    case 'CONCAT': {
      const newConcatFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/concatenate',
        display_name: 'Concatenate',
      }
      return { path: data.path, value: newConcatFormula }
    }
    case 'DEFAULT': {
      const newDefaultFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/defaultTo',
        // The old DEFAULT formula did not support variableArguments
        variableArguments: true,
        display_name: 'Default to',
      }
      return { path: data.path, value: newDefaultFormula }
    }
    case 'DELETE': {
      const newDeleteFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/deleteKey',
        display_name: 'Delete',
      }
      return { path: data.path, value: newDeleteFormula }
    }
    case 'DROP_LAST': {
      const newDropLastFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/dropLast',
        display_name: 'Drop Last',
        arguments: data.value.arguments
          ? renameArguments(ARRAY_ARGUMENT_MAPPINGS, data.value.arguments)
          : data.value.arguments,
      }
      return { path: data.path, value: newDropLastFormula }
    }
    case 'EQ': {
      const newEqualsFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/equals',
        display_name: 'Equals',
      }
      return { path: data.path, value: newEqualsFormula }
    }
    case 'FIND INDEX': {
      const newFindIndexFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/findIndex',
        display_name: 'Find index',
        arguments: renameArguments(
          PREDICATE_ARGUMENT_MAPPINGS,
          data.value.arguments,
        ),
      }
      return { path: data.path, value: newFindIndexFormula }
    }
    case 'FLAT': {
      const newFlattenFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/flatten',
        display_name: 'Flatten',
        arguments: renameArguments(
          ARRAY_ARGUMENT_MAPPINGS,
          data.value.arguments,
        ),
      }
      return { path: data.path, value: newFlattenFormula }
    }
    case 'GT': {
      const newGreaterThanFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/greaterThan',
        display_name: 'Greater than',
      }
      return { path: data.path, value: newGreaterThanFormula }
    }
    case 'GTE': {
      const newGreaterOrEqualFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/greaterOrEqueal',
        display_name: 'Greater or equal',
      }
      return { path: data.path, value: newGreaterOrEqualFormula }
    }
    case 'GROUP_BY': {
      const newGroupbyFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/groupBy',
        display_name: 'Group by',
        arguments: renameArguments(
          PREDICATE_ARGUMENT_MAPPINGS,
          data.value.arguments,
        ),
      }
      return { path: data.path, value: newGroupbyFormula }
    }
    case 'IF': {
      const legacyIfFormula = omitKeys(data.value, ['arguments', 'name'])
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      const ifArguments = data.value.arguments ?? []
      const switchFormula: SwitchOperation = {
        ...legacyIfFormula,
        type: 'switch',
        cases: [
          {
            condition: ifArguments[0]?.formula,
            formula: ifArguments[1]?.formula,
          },
        ],
        default: ifArguments[2]?.formula,
      }
      return { path: data.path, value: switchFormula }
    }
    case 'INDEX OF': {
      const newIndexofFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/indexOf',
        display_name: 'Index of',
        arguments: renameArguments(
          PREDICATE_ARGUMENT_MAPPINGS,
          data.value.arguments,
        ),
      }
      return { path: data.path, value: newIndexofFormula }
    }
    case 'JSON_PARSE': {
      const newJsonParseFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/parseJSON',
        display_name: 'Parse JSON',
        arguments: renameArguments(
          { Input: 'JSON string' },
          data.value.arguments,
        ),
      }
      return { path: data.path, value: newJsonParseFormula }
    }
    case 'KEY_BY': {
      const newKeyByFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/keyBy',
        display_name: 'Key by',
        arguments: renameArguments(
          {
            ...ARRAY_ARGUMENT_MAPPINGS,
            'Key formula': 'Formula',
          },
          data.value.arguments,
        ),
      }
      return { path: data.path, value: newKeyByFormula }
    }
    case 'LIST': {
      const newArrayFormula: ArrayOperation = {
        type: 'array',
        arguments: data.value.arguments,
      }
      return { path: data.path, value: newArrayFormula }
    }
    case 'LOWER': {
      const newLowercaseFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/lowercase',
        display_name: 'Lower case',
      }
      return { path: data.path, value: newLowercaseFormula }
    }
    case 'LT': {
      const newLessThanFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/lessThan',
        display_name: 'Less than',
      }
      return { path: data.path, value: newLessThanFormula }
    }
    case 'LTE': {
      const newLessOrEqualFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/lessOrEqual',
        display_name: 'Less or equal',
      }
      return { path: data.path, value: newLessOrEqualFormula }
    }
    case 'MOD': {
      const newModuloFormula: FunctionOperation = {
        ...data.value,
        arguments: renameArguments(
          { Dividor: 'Divider' },
          data.value.arguments,
        ),
        name: '@toddle/modulo',
        display_name: 'Modulo',
      }
      return { path: data.path, value: newModuloFormula }
    }
    case 'NEQ': {
      const newNotEqualFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/notEqual',
        display_name: 'Not equal',
      }
      return { path: data.path, value: newNotEqualFormula }
    }
    case 'OR': {
      const { name, ...legacyOrFormula } = data.value
      // Replace the AND formula with an 'and' formula
      const andFormula: OrOperation = {
        ...legacyOrFormula,
        type: 'or',
        arguments: (legacyOrFormula.arguments ?? []).map((a) => {
          const { name, ...argument } = a
          return argument
        }),
      }
      return { path: data.path, value: andFormula }
    }
    case 'RANDOM': {
      const newRandomNumberFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/randomNumber',
        display_name: 'Random number',
      }
      return { path: data.path, value: newRandomNumberFormula }
    }
    case 'SIZE': {
      const newSizeFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/size',
        display_name: 'Size',
      }
      return { path: data.path, value: newSizeFormula }
    }
    case 'SQRT': {
      const newSqrtFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/squareRoot',
        display_name: 'Square Root',
      }
      return { path: data.path, value: newSqrtFormula }
    }
    case 'STARTS_WITH': {
      const newStartsWithFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/startsWith',
        display_name: 'Starts with',
        arguments: renameArguments({ Input: 'String' }, data.value.arguments),
      }
      return { path: data.path, value: newStartsWithFormula }
    }
    case 'TAKE_LAST': {
      const newTakeLastFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/takeLast',
        display_name: 'Take last',
        arguments: renameArguments(
          ARRAY_ARGUMENT_MAPPINGS,
          data.value.arguments,
        ),
      }
      return { path: data.path, value: newTakeLastFormula }
    }
    case 'TYPE':
      // We can't autofix this one as the types have changed
      break
    case 'UPPER': {
      const newUpperFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/uppercase',
        display_name: 'Uppercase',
        arguments: renameArguments(
          ARRAY_ARGUMENT_MAPPINGS,
          data.value.arguments,
        ),
      }
      return { path: data.path, value: newUpperFormula }
    }
    case 'URI_ENCODE': {
      const newUriEncodeFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/encodeURIComponent',
        display_name: 'Encode URI Component',
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        arguments: data.value.arguments?.map((arg) => ({
          ...arg,
          // Let's fix this typo as well
          name: arg.name === 'URI' ? 'URIComponent' : arg.name,
        })),
      }
      return { path: data.path, value: newUriEncodeFormula }
    }

    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! //
    // ℹ️ Below is handling of the builtin formulas that can be updated ℹ️  //
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! //

    case 'ABSOLUTE': {
      const newAbsoluteFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/absolute',
        display_name: 'Absolute',
      }
      return { path: data.path, value: newAbsoluteFormula }
    }
    case 'ADD': {
      const newAddFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/add',
        display_name: 'Add',
      }
      return { path: data.path, value: newAddFormula }
    }
    case 'APPEND': {
      const newAppendFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/append',
        display_name: 'Append',
      }
      return { path: data.path, value: newAppendFormula }
    }
    case 'CLAMP': {
      const newClampFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/clamp',
        display_name: 'Clamp',
      }
      return { path: data.path, value: newClampFormula }
    }
    case 'DIVIDE': {
      const newDivideFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/divide',
        display_name: 'Divide',
      }
      return { path: data.path, value: newDivideFormula }
    }
    case 'DROP': {
      const newDropFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/drop',
        display_name: 'Drop',
      }
      return { path: data.path, value: newDropFormula }
    }
    case 'ENTRIES': {
      const newEntriesFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/entries',
        display_name: 'Entries',
      }
      return { path: data.path, value: newEntriesFormula }
    }
    case 'EVERY': {
      const newEveryFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/every',
        display_name: 'Every',
        arguments: renameArguments(
          PREDICATE_ARGUMENT_MAPPINGS,
          data.value.arguments,
        ),
      }
      return { path: data.path, value: newEveryFormula }
    }
    case 'FILTER': {
      const newFilterFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/filter',
        display_name: 'Filter',
        arguments: renameArguments(
          PREDICATE_ARGUMENT_MAPPINGS,
          data.value.arguments,
        ),
      }
      return { path: data.path, value: newFilterFormula }
    }
    case 'FIND': {
      const newFindFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/find',
        display_name: 'Find',
        arguments: renameArguments(
          PREDICATE_ARGUMENT_MAPPINGS,
          data.value.arguments,
        ),
      }
      return { path: data.path, value: newFindFormula }
    }
    case 'FROMENTRIES': {
      const newFromentriesFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/fromEntries',
        display_name: 'From entries',
        arguments: renameArguments(
          PREDICATE_ARGUMENT_MAPPINGS,
          data.value.arguments,
        ),
      }
      return { path: data.path, value: newFromentriesFormula }
    }
    case 'GET': {
      const newGetFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/get',
        display_name: 'Get',
      }
      return { path: data.path, value: newGetFormula }
    }
    case 'INCLUDES': {
      const newIncludesFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/includes',
        display_name: 'Includes',
        arguments: renameArguments(
          PREDICATE_ARGUMENT_MAPPINGS,
          data.value.arguments,
        ),
      }
      return { path: data.path, value: newIncludesFormula }
    }
    case 'JOIN': {
      const newJoinFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/join',
        display_name: 'Join',
        arguments: renameArguments(
          PREDICATE_ARGUMENT_MAPPINGS,
          data.value.arguments,
        ),
      }
      return { path: data.path, value: newJoinFormula }
    }
    case 'MAP': {
      const newMapFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/map',
        display_name: 'Map',
        arguments: renameArguments(
          {
            ...ARRAY_ARGUMENT_MAPPINGS,
            'Mapping fx': 'Formula',
          },
          data.value.arguments,
        ),
      }
      return { path: data.path, value: newMapFormula }
    }
    case 'MAX': {
      const newMaxFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/max',
        display_name: 'Max',
        arguments: renameArguments(
          ARRAY_ARGUMENT_MAPPINGS,
          data.value.arguments,
        ),
      }
      return { path: data.path, value: newMaxFormula }
    }
    case 'MIN': {
      const newMinFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/min',
        display_name: 'Min',
        arguments: renameArguments(
          ARRAY_ARGUMENT_MAPPINGS,
          data.value.arguments,
        ),
      }
      return { path: data.path, value: newMinFormula }
    }
    case 'MINUS': {
      const newMinusFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/minus',
        display_name: 'Minus',
      }
      return { path: data.path, value: newMinusFormula }
    }
    case 'MULTIPLY': {
      const newMultiplyFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/multiply',
        display_name: 'Multiply',
      }
      return { path: data.path, value: newMultiplyFormula }
    }
    case 'NOT': {
      const newNotFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/not',
        display_name: 'Not',
      }
      return { path: data.path, value: newNotFormula }
    }
    case 'NUMBER': {
      const newNumberFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/number',
        display_name: 'Number',
      }
      return { path: data.path, value: newNumberFormula }
    }
    case 'RANGE': {
      const newRangeFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/range',
        display_name: 'Range',
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        arguments: data.value.arguments?.map((arg, i) => ({
          ...arg,
          // The Max argument didn't always have a name
          name: i === 1 && typeof arg.name !== 'string' ? 'Max' : arg.name,
        })),
      }
      return { path: data.path, value: newRangeFormula }
    }
    case 'REDUCE': {
      const newReduceFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/reduce',
        display_name: 'Reduce',
        arguments: renameArguments(
          { 'Reducer fx': 'Formula' },
          data.value.arguments,
        ),
      }
      return { path: data.path, value: newReduceFormula }
    }
    case 'REPLACEALL': {
      const newReplaceallFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/replaceAll',
        display_name: 'Replace all',
        arguments: renameArguments(
          // Yes, there was a typo in the old argument name
          { 'String to repalce': 'Search' },
          data.value.arguments,
        ),
      }
      return { path: data.path, value: newReplaceallFormula }
    }
    case 'REVERSE': {
      const newReverseFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/reverse',
        display_name: 'Reverse',
        arguments: renameArguments(
          ARRAY_ARGUMENT_MAPPINGS,
          data.value.arguments,
        ),
      }
      return { path: data.path, value: newReverseFormula }
    }
    case 'ROUND': {
      const newRoundFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/round',
        display_name: 'Round',
      }
      return { path: data.path, value: newRoundFormula }
    }
    case 'SET': {
      const newSetFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/set',
        display_name: 'Set',
      }
      return { path: data.path, value: newSetFormula }
    }
    case 'SOME': {
      const newSomeFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/some',
        display_name: 'Some',
        arguments: renameArguments(
          PREDICATE_ARGUMENT_MAPPINGS,
          data.value.arguments,
        ),
      }
      return { path: data.path, value: newSomeFormula }
    }
    case 'SPLIT': {
      const newSplitFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/split',
        display_name: 'Split',
      }
      return { path: data.path, value: newSplitFormula }
    }
    case 'STRING': {
      const newStringFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/string',
        display_name: 'String',
      }
      return { path: data.path, value: newStringFormula }
    }
    case 'SUM': {
      const newSumFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/sum',
        display_name: 'Sum',
      }
      return { path: data.path, value: newSumFormula }
    }
    case 'TAKE': {
      const newTakeFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/take',
        display_name: 'Take',
        arguments: renameArguments(
          ARRAY_ARGUMENT_MAPPINGS,
          data.value.arguments,
        ),
      }
      return { path: data.path, value: newTakeFormula }
    }
    case 'TRIM': {
      const newTrimFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/trim',
        display_name: 'Trim',
      }
      return { path: data.path, value: newTrimFormula }
    }
  }
}
