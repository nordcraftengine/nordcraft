import type { Component } from '@nordcraft/core'
import {
  isDefined,
  isPageComponent,
  safeCustomElementName,
} from '@nordcraft/core'
import type { ProjectFilesWithCustomCode } from '@nordcraft/ssr'
import {
  getFontCssUrl,
  removeTestData,
  replaceTagInNodes,
  resolveClasses,
  takeIncludedComponents,
  transformRelativePaths,
} from '@nordcraft/ssr'
import type { Context } from 'hono'
import type { HonoEnv, HonoProject } from '../../hono'
import type { PageLoader } from '../loaders/types'

/**
 * Browser-side script that injects the theme font stylesheets into <head>.
 */
const FONT_LOADER_SCRIPT = `
(function (fontUrls) {
  /*
   * Font loading in shadow DOM is not supported (@font-face inside a shadow root
   * is ignored), so the stylesheet has to live in the document <head>.
   *
   * To avoid text flashing to a fallback font and back, we must never add a second
   * @font-face for a face the page already declares. We therefore compare on the
   * actual faces (family + style + weight) and only request the missing ones.
   * Injected links stay in <head>, so later runs find them and skip them.
   */
  const normalize = (s) => s.replace(/^['"]|['"]$/g, '').trim().toLowerCase();
  const toWeight = (w) => {
    const v = String(w || '400').trim().toLowerCase().replace('..', ' ');
    return v === 'normal' ? '400' : v === 'bold' ? '700' : v;
  };
  const toStyle = (s) =>
    /^(italic|oblique)/.test(String(s || '').trim().toLowerCase()) ? 'italic' : 'normal';
  const toRange = (w) => {
    const p = w.split(' ').map(Number);
    return [p[0], p.length > 1 ? p[1] : p[0]];
  };

  // Legacy API: "Roboto:400,700|Open+Sans" or "Roboto:400,700" (no "@")
  const isLegacy = (spec) => spec.includes('|') || (spec.includes(':') && !spec.includes('@'));
  const legacyNames = (spec) => spec.split('|').map((p) => normalize(p.split(':')[0]));

  // CSS2 API: "Inter", "Inter:wght@400;700", "Inter:ital,wght@0,400;1,700"
  const parseSpec = (spec) => {
    const at = spec.indexOf('@');
    const head = at === -1 ? spec : spec.slice(0, at);
    const colon = head.indexOf(':');
    return {
      name: (colon === -1 ? head : head.slice(0, colon)).trim(),
      axes: colon === -1 ? [] : head.slice(colon + 1).split(',').map((a) => a.trim()),
      tuples: at === -1 ? [] : spec.slice(at + 1).split(';').map((t) => t.split(',')),
    };
  };
  const variantsOf = (p) => {
    if (p.tuples.length === 0) return [{ tuple: null, style: 'normal', weight: '400' }];
    const wi = p.axes.indexOf('wght');
    const ii = p.axes.indexOf('ital');
    return p.tuples.map((t) => ({
      tuple: t,
      style: ii !== -1 && t[ii] === '1' ? 'italic' : 'normal',
      weight: toWeight(wi !== -1 ? t[wi] : '400'),
    }));
  };

  const existing = new Map(); // family -> { all: boolean, faces: { style, weight }[] }
  const entry = (name) => {
    let e = existing.get(name);
    if (!e) existing.set(name, (e = { all: false, faces: [] }));
    return e;
  };
  const addFace = (name, style, weight) =>
    entry(name).faces.push({ style, weight: toWeight(weight) });
  const addFamily = (name) => {
    entry(name).all = true;
  };
  const isCovered = (name, v) => {
    const e = existing.get(name);
    if (!e) return false;
    if (e.all) return true;
    const [min, max] = toRange(v.weight);
    return e.faces.some((f) => {
      if (f.style !== v.style) return false;
      const [a, b] = toRange(f.weight);
      return a <= min && b >= max;
    });
  };

  // 1. Faces the browser already knows about
  for (const f of Array.from(document.fonts ?? [])) {
    addFace(normalize(f.family), toStyle(f.style), f.weight);
  }
  // 2. Stylesheets that may still be loading (page-provided or injected earlier)
  for (const link of document.querySelectorAll('link[rel="stylesheet"]')) {
    try {
      const url = new URL(link.getAttribute('href') || '', document.baseURI);
      for (const spec of url.searchParams.getAll('family')) {
        if (isLegacy(spec)) {
          legacyNames(spec).forEach(addFamily);
          continue;
        }
        const p = parseSpec(spec);
        for (const v of variantsOf(p)) addFace(normalize(p.name), v.style, v.weight);
      }
    } catch (e) {
      /* unparsable href, ignore */
    }
  }

  for (const rawUrl of fontUrls) {
    let fontUrl;
    try {
      fontUrl = new URL(rawUrl);
    } catch (e) {
      continue; // one bad URL must not stop the others
    }
    const wanted = [];
    for (const spec of new Set(fontUrl.searchParams.getAll('family'))) {
      if (isLegacy(spec)) {
        const names = legacyNames(spec);
        if (!names.every((n) => existing.has(n))) wanted.push(spec);
        names.forEach(addFamily);
        continue;
      }
      const p = parseSpec(spec);
      const name = normalize(p.name);
      const all = variantsOf(p);
      const missing = all.filter((v) => !isCovered(name, v));
      if (missing.length === 0) continue;
      if (missing.length === all.length || p.tuples.length === 0) {
        wanted.push(spec);
      } else {
        // Only request the faces that are missing, existing ones are left untouched
        wanted.push(
          p.name + ':' + p.axes.join(',') + '@' + missing.map((v) => v.tuple.join(',')).join(';'),
        );
      }
      for (const v of missing) addFace(name, v.style, v.weight);
    }
    if (wanted.length === 0) continue;
    fontUrl.searchParams.delete('family');
    for (const spec of wanted) fontUrl.searchParams.append('family', spec);
    const linkElem = document.createElement('link');
    linkElem.setAttribute('rel', 'stylesheet');
    linkElem.setAttribute('href', fontUrl.toString());
    linkElem.setAttribute('data-nordcraft-font', '');
    document.head.prepend(linkElem);
  }
})(__FONT_URLS__);
`

export const getFontLoaderScript = (fontUrls: string[]) =>
  FONT_LOADER_SCRIPT.replace(
    '__FONT_URLS__',
    // Function replacer so `$` sequences in URLs aren't interpreted,
    // and escape `<` so a URL can never close an inline <script>
    () => JSON.stringify(fontUrls).replace(/</g, '\\u003c'),
  )

export const customElement =
  (pageLoader: PageLoader) =>
  async (
    ctx: Context<
      HonoEnv<
        HonoProject & {
          files: ProjectFilesWithCustomCode
          component: Component
        }
      >,
      '/.toddle/custom-element/:filename{.+.js}'
    >,
  ) => {
    const url = new URL(ctx.req.url)
    const project = ctx.var.project
    const errorResponse = (error: string, status: 403 | 404) =>
      ctx.json(
        {
          error,
          info: `Please see https://docs.nordcraft.com/components/export-a-component#export-as-web-component for more information on web component export`,
        },
        {
          headers: {
            // Allow all origins for error responses.
            // This is useful for debugging if a web component doesn't load/work
            'Access-Control-Allow-Origin': '*',
          },
          status,
        },
      )

    const componentName = ctx.req.param('filename').replace('.js', '')
    const files = await pageLoader({
      ctx,
      name: componentName,
    })
    if (!files) {
      return errorResponse('Component not found', 404)
    }
    const component = files.components?.[componentName]
    if (!component) {
      return errorResponse('Component not found', 404)
    }
    try {
      if (isPageComponent(component)) {
        return errorResponse(
          `Pages are not supported as custom elements, only components`,
          403,
        )
      }

      const themes = files.themes ?? {}
      const fontsToLoad = Object.values(themes).flatMap((theme) => theme.fonts)
      const includedComponents = takeIncludedComponents({
        root: component,
        projectComponents: files.components,
        packages: files.packages,
      })
      const customCodeSearchParams = new URLSearchParams([
        ['entry', component.name],
      ])
      const fontStylesheetUrl = getFontCssUrl({
        fonts: fontsToLoad,
        baseForAbsoluteUrls: url.origin,
      })
      const content = `/*
 * This file is autogenerated by Nordcraft and should not be edited manually.
 *
 * <${safeCustomElementName(component.name)} />
 *
 * Attributes:
 *
 * ${Object.values(component.attributes ?? {})
   .filter(isDefined)
   .map((attr) => `- ${attr.name}`)
   .join('\n * ')}
 *
 * Events:
 *
 * ${Object.values(component.events ?? {})
   .filter(isDefined)
   .map((event) => `- ${event.name}`)
   .join('\n * ')}
 */

import { defineComponents, loadCorePlugins } from '/_static/custom-element.main.esm.js';
${
  files.customCode
    ? `import { loadCustomCode, formulas, actions } from '/.toddle/custom-code.js?${customCodeSearchParams.toString()}';`
    : `\
const formulas = {};
const actions = {};`
}

${
  isDefined(fontStylesheetUrl)
    ? getFontLoaderScript(Object.values(fontStylesheetUrl))
    : ''
}

// Global toddle object
const toddle = (() => {
  const legacyActions = {}
  const legacyFormulas = {}
  const argumentInputDataList = {}
  return {
    formulas,
    actions,
    errors:[],
    project:"${project.name}",
    branch:"main",
    commit:"unknown",
    registerAction: (name, handler) => {
      if (legacyActions[name]) {
        console.error('There already exists an action with the name ', name)
        return
      }
      legacyActions[name] = handler
    },
    getAction: (name) => legacyActions[name],
    registerFormula: (name,handler,getArgumentInputData) => {
      if (legacyFormulas[name]) {
        console.error('There already exists a formula with the name ', name)
        return
      }
      legacyFormulas[name] = handler
      if (getArgumentInputData) {
        argumentInputDataList[name] = getArgumentInputData
      }
    },
    getFormula: (name) => legacyFormulas[name],
    getCustomAction: (name, packageName) => {
      return actions[packageName ?? "${project.name}"]?.[name] ?? actions["${
        project.name
      }"]?.[name]
    },
    getCustomFormula: (name, packageName) => {
      return formulas[packageName ?? "${project.name}"]?.[name] ?? formulas["${
        project.name
      }"]?.[name]
    },
    getArgumentInputData: (formulaName,args,argIndex,data
    ) => argumentInputDataList[formulaName]?.(args, argIndex, data) || data,
    data: {},
    locationSignal: null,
    eventLog: [],
    pageState: {},
    env: {
      isServer: false,
      branchName: "main",
      request: undefined,
    }
  }
})();

// Load core plugin (actions and formulas)
loadCorePlugins(toddle);

${
  files.customCode
    ? `\
// Load project's custom actions and formulas
loadCustomCode();`
    : ''
}

// toddle.isEqual is required for some formulas to work. TODO: Remove this once they can consume from somewhere else.
if(!globalThis.toddle || !globalThis.toddle.isEqual) {
  globalThis.toddle = {
    isEqual: toddle.isEqual,
  }
}

// Define the custom element
defineComponents(${JSON.stringify([component.name])}, ${JSON.stringify({
        themes,
        components: includedComponents
          .map(replaceTagInNodes(safeCustomElementName(component.name), 'div'))
          .map(removeTestData)
          .map(transformRelativePaths(url.origin))
          .map(resolveClasses({ clearStyle: false })),
      })}, toddle);
`
      ctx.header('Cache-Control', 'no-cache')
      ctx.header('Access-Control-Allow-Origin', '*')
      ctx.header('Content-Type', 'text/javascript')
      return ctx.body(content)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e)
      return errorResponse('404', 404)
    }
  }
