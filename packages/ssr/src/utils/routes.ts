import type { RouteDeclaration } from '@nordcraft/core/dist/component/component.types'
import { isPageComponent } from '@nordcraft/core/dist/component/isPageComponent'
import {
  isToddleFormula,
  type PluginFormula,
} from '@nordcraft/core/dist/formula/formulaTypes'
import { createStylesheet } from '@nordcraft/core/dist/styling/style.css'
import { theme as defaultTheme } from '@nordcraft/core/dist/styling/theme.const'
import { filterObject, mapObject } from '@nordcraft/core/dist/utils/collections'
import { takeIncludedComponents } from '../components/utils'
import {
  generateCustomCodeFile,
  hasCustomCode,
  takeReferencedFormulasAndActions,
} from '../custom-code/codeRefs'
import { removeTestData } from '../rendering/testData'
import type { ProjectFiles, Route, ToddleProject } from '../ssr.types'

interface Routes {
  pages: Record<string, { name: string; route: RouteDeclaration }>
  routes: Record<string, Route>
}

export type ProjectFilesWithCustomCode = ProjectFiles & {
  customCode: boolean
}

export type Files = Record<string, ProjectFilesWithCustomCode>

export const splitRoutes = (json: {
  files: ProjectFiles
  project: ToddleProject
}): {
  project: { project: ToddleProject; config: ProjectFiles['config'] }
  routes: Routes
  files: Files
  styles: Record<string, string>
  code: Record<string, string>
} => {
  const filesMap: Files = {}
  const stylesMap: Record<string, string> = {}
  const codeMap: Record<string, string> = {}
  const { files } = json

  const routes: Routes = {
    routes: { ...(files.routes ?? {}) },
    pages: {},
  }
  Object.entries(files.components).forEach(([name, component]) => {
    if (component) {
      if (isPageComponent(component)) {
        routes.pages[name] = {
          name,
          route: {
            path: component.route.path,
            query: component.route.query,
          },
        }
        const components = takeIncludedComponents({
          root: component,
          projectComponents: files.components,
          packages: files.packages,
          includeRoot: true,
        })
        const theme =
          (files.themes
            ? Object.values(files.themes)[0]
            : files.config?.theme) ?? defaultTheme
        const styles = createStylesheet(component, components, theme, {
          // The reset stylesheet is loaded separately
          includeResetStyle: false,
          // Font faces are created from a stylesheet referenced in the head
          createFontFaces: false,
        })
        stylesMap[name] = styles
        let customCode = false
        let formulas: Record<string, PluginFormula<string>> = {}
        if (hasCustomCode(component, files)) {
          customCode = true
          const code = takeReferencedFormulasAndActions({
            component,
            files,
          })
          const output = generateCustomCodeFile({
            code,
            componentName: component.name,
            projectId: json.project.short_id,
          })
          codeMap[name] = output
          formulas = filterObject(code.__PROJECT__.formulas, ([_, formula]) =>
            // custom formulas are not supported during SSR yet
            isToddleFormula(formula),
          )
        }

        filesMap[name] = {
          customCode,
          config: files.config,
          themes: files.themes,
          components: Object.fromEntries(
            components.map((c) => [c.name, removeTestData(c)]),
          ),
          formulas,
          ...(files.packages
            ? {
                packages: mapObject(files.packages, ([key, pkg]) => [
                  key,
                  {
                    ...pkg,
                    components: mapObject(
                      // Only include package components that are used by the page
                      filterObject(pkg.components, ([_, pkgComponent]) =>
                        components.some(
                          (c) =>
                            pkgComponent &&
                            c.name ===
                              `${pkg.manifest.name}/${pkgComponent.name}`,
                        ),
                      ),
                      // Remove test data from package components
                      ([cKey, c]) => [cKey, c ? removeTestData(c) : c],
                    ),
                    // Actions are not available during SSR
                    actions: {},
                    // TODO: Only include relevant formulas from packages
                    formulas: filterObject(
                      pkg.formulas ?? {},
                      ([_, pkgFormula]) =>
                        // custom formulas are not supported during SSR yet
                        isToddleFormula(pkgFormula),
                    ),
                  },
                ]),
              }
            : undefined),
        }
      }
    }
  })

  return {
    routes,
    files: filesMap,
    styles: stylesMap,
    code: codeMap,
    project: { project: json.project, config: files.config },
  }
}
