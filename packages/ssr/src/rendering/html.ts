import type { ComponentData, FormulaContext, PageRoute } from '@nordcraft/core'
import { applyFormula, THEME_COOKIE_NAME } from '@nordcraft/core'

export const getHtmlLanguage = ({
  pageInfo,
  formulaContext,
  data,
  defaultLanguage = 'en',
}: {
  pageInfo?: PageRoute['info']
  formulaContext: FormulaContext
  data: ComponentData
  defaultLanguage?: string
}) => {
  const language = pageInfo?.language
    ? applyFormula(pageInfo.language.formula, formulaContext, data)
    : defaultLanguage
  return typeof language === 'string' ? language : defaultLanguage
}

export const getCharset = ({
  pageInfo,
  formulaContext,
  data,
  defaultCharset = 'utf-8',
}: {
  pageInfo?: PageRoute['info']
  formulaContext: FormulaContext
  data: ComponentData
  defaultCharset?: string
}) => {
  const charset = pageInfo?.charset
    ? (applyFormula(pageInfo.charset.formula, formulaContext, data) as string)
    : defaultCharset
  return typeof charset === 'string' ? charset : defaultCharset
}

export const getTheme = ({
  pageInfo,
  formulaContext,
  data,
}: {
  pageInfo?: PageRoute['info']
  formulaContext: FormulaContext
  data: ComponentData
}) => {
  const theme = pageInfo?.theme?.formula
    ? (applyFormula(pageInfo.theme.formula, formulaContext, data) as string)
    : formulaContext.env?.request?.cookies[THEME_COOKIE_NAME]
  return typeof theme === 'string' ? theme : null
}
