import type {
  AndOperation,
  ArrayOperation,
  FunctionOperation,
  OrOperation,
  SwitchOperation,
} from '@nordcraft/core/dist/formula/formula'
import { omitKeys, set } from '@nordcraft/core/dist/utils/collections'
import type { FixFunction, FormulaNode } from '../../../types'
import {
  ARRAY_ARGUMENT_MAPPINGS,
  PREDICATE_ARGUMENT_MAPPINGS,
  renameArguments,
} from '../../../util/helpers'

export const replaceLegacyFormula: FixFunction<
  FormulaNode<FunctionOperation>
> = (data) => {
  switch (data.value.name) {
    // Known legacy formulas first
    case 'AND': {
      const { name, ...legacyAndFormula } = data.value
      const andFormula: AndOperation = {
        ...legacyAndFormula,
        type: 'and',
        arguments: legacyAndFormula.arguments.map((a) => {
          const { name, ...argument } = a
          return argument
        }),
      }
      return set(data.files, data.path, andFormula)
    }
    case 'CONCAT': {
      const newConcatFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/concatenate',
        display_name: 'Concatenate',
      }
      return set(data.files, data.path, newConcatFormula)
    }
    case 'DEFAULT': {
      const newDefaultFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/defaultTo',
        // The old DEFAULT formula did not support variableArguments
        variableArguments: true,
        display_name: 'Default to',
      }
      return set(data.files, data.path, newDefaultFormula)
    }
    case 'DELETE': {
      const newDeleteFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/deleteKey',
        display_name: 'Delete',
      }
      return set(data.files, data.path, newDeleteFormula)
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
      return set(data.files, data.path, newDropLastFormula)
    }
    case 'EQ': {
      const newEqualsFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/equals',
        display_name: 'Equals',
      }
      return set(data.files, data.path, newEqualsFormula)
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
      return set(data.files, data.path, newFindIndexFormula)
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
      return set(data.files, data.path, newFlattenFormula)
    }
    case 'GT': {
      const newGreaterThanFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/greaterThan',
        display_name: 'Greater than',
      }
      return set(data.files, data.path, newGreaterThanFormula)
    }
    case 'GTE': {
      const newGreaterOrEqualFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/greaterOrEqueal',
        display_name: 'Greater or equal',
      }
      return set(data.files, data.path, newGreaterOrEqualFormula)
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
      return set(data.files, data.path, newGroupbyFormula)
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
      return set(data.files, data.path, switchFormula)
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
      return set(data.files, data.path, newIndexofFormula)
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
      return set(data.files, data.path, newJsonParseFormula)
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
      return set(data.files, data.path, newKeyByFormula)
    }
    case 'LIST': {
      const newArrayFormula: ArrayOperation = {
        type: 'array',
        arguments: data.value.arguments,
      }
      return set(data.files, data.path, newArrayFormula)
    }
    case 'LOWER': {
      const newLowercaseFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/lowercase',
        display_name: 'Lower case',
      }
      return set(data.files, data.path, newLowercaseFormula)
    }
    case 'LT': {
      const newLessThanFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/lessThan',
        display_name: 'Less than',
      }
      return set(data.files, data.path, newLessThanFormula)
    }
    case 'LTE': {
      const newLessOrEqualFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/lessOrEqual',
        display_name: 'Less or equal',
      }
      return set(data.files, data.path, newLessOrEqualFormula)
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
      return set(data.files, data.path, newModuloFormula)
    }
    case 'NEQ': {
      const newNotEqualFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/notEqual',
        display_name: 'Not equal',
      }
      return set(data.files, data.path, newNotEqualFormula)
    }
    case 'OR': {
      const { name, ...legacyOrFormula } = data.value
      // Replace the AND formula with an 'and' formula
      const andFormula: OrOperation = {
        ...legacyOrFormula,
        type: 'or',
        arguments: legacyOrFormula.arguments.map((a) => {
          const { name, ...argument } = a
          return argument
        }),
      }
      return set(data.files, data.path, andFormula)
    }
    case 'RANDOM': {
      const newRandomNumberFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/randomNumber',
        display_name: 'Random number',
      }
      return set(data.files, data.path, newRandomNumberFormula)
    }
    case 'SIZE': {
      const newSizeFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/size',
        display_name: 'Size',
      }
      return set(data.files, data.path, newSizeFormula)
    }
    case 'SQRT': {
      const newSqrtFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/squareRoot',
        display_name: 'Square Root',
      }
      return set(data.files, data.path, newSqrtFormula)
    }
    case 'STARTS_WITH': {
      const newStartsWithFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/startsWith',
        display_name: 'Starts with',
        arguments: renameArguments({ Input: 'String' }, data.value.arguments),
      }
      return set(data.files, data.path, newStartsWithFormula)
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
      return set(data.files, data.path, newTakeLastFormula)
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
      return set(data.files, data.path, newUpperFormula)
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
      return set(data.files, data.path, newUriEncodeFormula)
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
      return set(data.files, data.path, newAbsoluteFormula)
    }
    case 'ADD': {
      const newAddFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/add',
        display_name: 'Add',
      }
      return set(data.files, data.path, newAddFormula)
    }
    case 'APPEND': {
      const newAppendFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/append',
        display_name: 'Append',
      }
      return set(data.files, data.path, newAppendFormula)
    }
    case 'CLAMP': {
      const newClampFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/clamp',
        display_name: 'Clamp',
      }
      return set(data.files, data.path, newClampFormula)
    }
    case 'DIVIDE': {
      const newDivideFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/divide',
        display_name: 'Divide',
      }
      return set(data.files, data.path, newDivideFormula)
    }
    case 'DROP': {
      const newDropFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/drop',
        display_name: 'Drop',
      }
      return set(data.files, data.path, newDropFormula)
    }
    case 'ENTRIES': {
      const newEntriesFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/entries',
        display_name: 'Entries',
      }
      return set(data.files, data.path, newEntriesFormula)
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
      return set(data.files, data.path, newEveryFormula)
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
      return set(data.files, data.path, newFilterFormula)
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
      return set(data.files, data.path, newFindFormula)
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
      return set(data.files, data.path, newFromentriesFormula)
    }
    case 'GET': {
      const newGetFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/get',
        display_name: 'Get',
      }
      return set(data.files, data.path, newGetFormula)
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
      return set(data.files, data.path, newIncludesFormula)
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
      return set(data.files, data.path, newJoinFormula)
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
      return set(data.files, data.path, newMapFormula)
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
      return set(data.files, data.path, newMaxFormula)
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
      return set(data.files, data.path, newMinFormula)
    }
    case 'MINUS': {
      const newMinusFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/minus',
        display_name: 'Minus',
      }
      return set(data.files, data.path, newMinusFormula)
    }
    case 'MULTIPLY': {
      const newMultiplyFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/multiply',
        display_name: 'Multiply',
      }
      return set(data.files, data.path, newMultiplyFormula)
    }
    case 'NOT': {
      const newNotFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/not',
        display_name: 'Not',
      }
      return set(data.files, data.path, newNotFormula)
    }
    case 'NUMBER': {
      const newNumberFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/number',
        display_name: 'Number',
      }
      return set(data.files, data.path, newNumberFormula)
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
      return set(data.files, data.path, newRangeFormula)
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
      return set(data.files, data.path, newReduceFormula)
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
      return set(data.files, data.path, newReplaceallFormula)
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
      return set(data.files, data.path, newReverseFormula)
    }
    case 'ROUND': {
      const newRoundFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/round',
        display_name: 'Round',
      }
      return set(data.files, data.path, newRoundFormula)
    }
    case 'SET': {
      const newSetFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/set',
        display_name: 'Set',
      }
      return set(data.files, data.path, newSetFormula)
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
      return set(data.files, data.path, newSomeFormula)
    }
    case 'SPLIT': {
      const newSplitFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/split',
        display_name: 'Split',
      }
      return set(data.files, data.path, newSplitFormula)
    }
    case 'STRING': {
      const newStringFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/string',
        display_name: 'String',
      }
      return set(data.files, data.path, newStringFormula)
    }
    case 'SUM': {
      const newSumFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/sum',
        display_name: 'Sum',
      }
      return set(data.files, data.path, newSumFormula)
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
      return set(data.files, data.path, newTakeFormula)
    }
    case 'TRIM': {
      const newTrimFormula: FunctionOperation = {
        ...data.value,
        name: '@toddle/trim',
        display_name: 'Trim',
      }
      return set(data.files, data.path, newTrimFormula)
    }
  }
}
