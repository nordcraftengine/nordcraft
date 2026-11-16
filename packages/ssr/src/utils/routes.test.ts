import { describe, expect, test } from 'bun:test'
import type { ProjectFiles, ToddleProject } from '../ssr.types'
import { splitRoutes } from './routes'

describe('splitRoutes', () => {
  const project: ToddleProject = {
    id: 'proj-1',
    short_id: 'my_project',
    name: 'My Project',
    type: 'app',
  }

  test('includes referenced v2 code formulas alongside ToddleFormulas in files', () => {
    const files: ProjectFiles = {
      components: {
        HomePage: {
          name: 'HomePage',
          route: { path: [], query: {} },
          nodes: {
            root: {
              type: 'element',
              tag: 'div',
              attrs: {},
              style: {},
              events: {},
              classes: {},
              children: ['textNode'],
            },
            textNode: {
              type: 'text',
              value: {
                type: 'function',
                name: 'myFormula',
                arguments: [
                  { name: 'first', formula: { type: 'value', value: 4 } },
                  { name: 'second', formula: { type: 'value', value: 5 } },
                ],
              },
            },
          },
          apis: {},
          variables: {},
          workflows: {},
        },
        AboutPage: {
          name: 'AboutPage',
          route: { path: [{ type: 'static', name: 'about' }], query: {} },
          nodes: {
            root: {
              type: 'element',
              tag: 'div',
              attrs: {},
              style: {},
              events: {},
              classes: {},
              children: [],
            },
          },
          apis: {},
          variables: {},
          workflows: {},
        },
      },
      formulas: {
        myFormula: {
          name: 'myFormula',
          version: 2,
          arguments: [{ name: 'first' }, { name: 'second' }],
          handler:
            'function myFormula({ first, second }) {\n  return first * second + first\n}',
        },
        legacyFormula: {
          name: 'legacyFormula',
          arguments: [],
          handler: 'toddle.registerFormula("legacyFormula", () => 1)',
        },
      },
    }

    const result = splitRoutes({
      branchName: 'main',
      files,
      project,
    })

    expect({
      homeFormulas: result.files.HomePage?.formulas,
      aboutFormulas: result.files.AboutPage?.formulas,
    }).toEqual({
      homeFormulas: {
        myFormula: {
          name: 'myFormula',
          version: 2,
          arguments: [{ name: 'first' }, { name: 'second' }],
          handler:
            'function myFormula({ first, second }) {\n  return first * second + first\n}',
        },
      },
      aboutFormulas: {},
    })
  })
})
