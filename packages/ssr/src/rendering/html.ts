import type { PageRoute } from '@nordcraft/core/dist/component/component.types'
import type { FormulaContext } from '@nordcraft/core/dist/formula/formula'
import { applyFormula } from '@nordcraft/core/dist/formula/formula'

export const getHtmlLanguage = ({
  pageInfo,
  formulaContext,
  defaultLanguage = 'en',
}: {
  pageInfo?: PageRoute['info']
  formulaContext: FormulaContext
  defaultLanguage?: string
}) => {
  const language = pageInfo?.language
    ? applyFormula(pageInfo.language.formula, formulaContext)
    : defaultLanguage
  return typeof language === 'string' ? language : defaultLanguage
}

export const getCharset = ({
  pageInfo,
  formulaContext,
  defaultCharset = 'utf-8',
}: {
  pageInfo?: PageRoute['info']
  formulaContext: FormulaContext
  defaultCharset?: string
}) => {
  const charset = pageInfo?.charset
    ? (applyFormula(pageInfo.charset.formula, formulaContext) as string)
    : defaultCharset
  return typeof charset === 'string' ? charset : defaultCharset
}

export const getTheme = ({
  pageInfo,
  formulaContext,
}: {
  pageInfo?: PageRoute['info']
  formulaContext: FormulaContext
}) => {
  const theme = pageInfo?.theme?.formula
    ? (applyFormula(pageInfo.theme.formula, formulaContext) as string)
    : formulaContext.env?.request?.cookies['theme']
  return typeof theme === 'string' ? theme : null
}
