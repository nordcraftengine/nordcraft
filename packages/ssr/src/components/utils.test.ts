import { describe, expect, test } from 'bun:test'
import { takeIncludedComponents } from './utils'

describe('takeIncludedComponents', () => {
  test('it finds all referenced components', () => {
    const includedComponents = takeIncludedComponents({
      root: {
        name: 'root',
        nodes: {
          projectComponent: {
            type: 'component',
            name: 'child',
            children: [],
            attrs: {},
            events: {},
          },
          packageComponent: {
            type: 'component',
            name: 'pComponent1',
            package: 'package-1',
            children: [],
            attrs: {},
            events: {},
          },
        },
        attributes: {},
        variables: {},
        apis: {},
      },
      projectComponents: {
        child: {
          name: 'child',
          nodes: {},
          attributes: {},
          variables: {},
          apis: {},
        },
        unreferencedChild: {
          name: 'unreferencedChild',
          nodes: {},
          attributes: {},
          variables: {},
          apis: {},
        },
      },
      packages: {
        'package-1': {
          manifest: { name: 'package-1', commit: 'xyz' },
          components: {
            pComponent1: {
              name: 'pComponent1',
              nodes: {
                internalPackageComponent: {
                  type: 'component',
                  name: 'internalPackageComponent',
                  children: [],
                  attrs: {},
                  events: {},
                },
              },
              attributes: {},
              variables: {},
              apis: {},
            },
            internalPackageComponent: {
              name: 'internalPackageComponent',
              nodes: {},
              attributes: {},
              variables: {},
              apis: {},
            },
            unusedInternalPackageComponent: {
              name: 'unusedInternalPackageComponent',
              nodes: {},
              attributes: {},
              variables: {},
              apis: {},
            },
          },
        },
      },
    })
    expect(includedComponents.map((c) => c.name)).toEqual([
      'root',
      'child',
      'package-1/pComponent1',
      'package-1/internalPackageComponent',
    ])
  })
})
