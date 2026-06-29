import { describe, expect, test } from 'bun:test'
import { ToddleComponent } from './ToddleComponent'
import type { Component } from './component.types'

describe('ToddleComponent.uniqueSubComponents', () => {
  test('it should pass down the package name to sub-components', () => {
    const packagedComp: Component = {
      name: 'PackagedComp',
      nodes: {
        node1: {
          type: 'component',
          name: 'InternalComp',
        },
      },
      apis: {},
      attributes: {},
      variables: {},
      workflows: {},
    }

    const internalComp: Component = {
      name: 'InternalComp',
      nodes: {},
      apis: {},
      attributes: {},
      variables: {},
      workflows: {},
    }

    const root: Component = {
      name: 'root',
      nodes: {
        node1: {
          type: 'component',
          name: 'PackagedComp',
          package: 'my-package',
        },
      },
      apis: {},
      attributes: {},
      variables: {},
      workflows: {},
    }

    const componentsMap: Record<string, Component> = {
      'my-package/PackagedComp': packagedComp,
      'my-package/InternalComp': internalComp,
    }

    const getComponent = (name: string, packageName?: string) => {
      const key = packageName ? `${packageName}/${name}` : name
      return componentsMap[key]
    }

    const demo = new ToddleComponent({
      component: root,
      getComponent,
      packageName: undefined,
      globalFormulas: { formulas: {}, packages: {} },
    })

    const subComponents = demo.uniqueSubComponents
    expect(subComponents).toHaveLength(2)
    expect(subComponents[0].name).toBe('PackagedComp')
    expect(subComponents[0].packageName).toBe('my-package')
    expect(subComponents[1].name).toBe('InternalComp')
    expect(subComponents[1].packageName).toBe('my-package')
  })

  test('it should handle nested components and avoid duplicates', () => {
    const compA: Component = {
      name: 'CompA',
      nodes: {
        node1: {
          type: 'component',
          name: 'CompB',
        },
      },
      apis: {},
      attributes: {},
      variables: {},
      workflows: {},
    }

    const compB: Component = {
      name: 'CompB',
      nodes: {},
      apis: {},
      attributes: {},
      variables: {},
      workflows: {},
    }

    const root: Component = {
      name: 'root',
      nodes: {
        node1: {
          type: 'component',
          name: 'CompA',
        },
        node2: {
          type: 'component',
          name: 'CompB',
        },
      },
      apis: {},
      attributes: {},
      variables: {},
      workflows: {},
    }

    const componentsMap: Record<string, Component> = {
      CompA: compA,
      CompB: compB,
    }

    const getComponent = (name: string, packageName?: string) => {
      const key = packageName ? `${packageName}/${name}` : name
      return componentsMap[key]
    }

    const demo = new ToddleComponent({
      component: root,
      getComponent,
      packageName: undefined,
      globalFormulas: { formulas: {}, packages: {} },
    })

    const subComponents = demo.uniqueSubComponents
    expect(subComponents).toHaveLength(2)
    const names = subComponents.map((c) => c.name).sort()
    expect(names).toEqual(['CompA', 'CompB'])
  })

  test('it should allow sub-components to override the package name', () => {
    const pkgAComp: Component = {
      name: 'PkgAComp',
      nodes: {
        node1: {
          type: 'component',
          name: 'PkgBComp',
          package: 'package-b',
        },
      },
      apis: {},
      attributes: {},
      variables: {},
      workflows: {},
    }

    const pkgBComp: Component = {
      name: 'PkgBComp',
      nodes: {
        node1: {
          type: 'component',
          name: 'InternalComp',
        },
      },
      apis: {},
      attributes: {},
      variables: {},
      workflows: {},
    }

    const internalComp: Component = {
      name: 'InternalComp',
      nodes: {},
      apis: {},
      attributes: {},
      variables: {},
      workflows: {},
    }

    const root: Component = {
      name: 'root',
      nodes: {
        node1: {
          type: 'component',
          name: 'PkgAComp',
          package: 'package-a',
        },
      },
      apis: {},
      attributes: {},
      variables: {},
      workflows: {},
    }

    const componentsMap: Record<string, Component> = {
      'package-a/PkgAComp': pkgAComp,
      'package-b/PkgBComp': pkgBComp,
      'package-b/InternalComp': internalComp,
    }

    const getComponent = (name: string, packageName?: string) => {
      const key = packageName ? `${packageName}/${name}` : name
      return componentsMap[key]
    }

    const demo = new ToddleComponent({
      component: root,
      getComponent,
      packageName: undefined,
      globalFormulas: { formulas: {}, packages: {} },
    })

    const subComponents = demo.uniqueSubComponents
    expect(subComponents).toHaveLength(3)

    const pA = subComponents.find((c) => c.name === 'PkgAComp')
    expect(pA?.packageName).toBe('package-a')

    const pB = subComponents.find((c) => c.name === 'PkgBComp')
    expect(pB?.packageName).toBe('package-b')

    const internal = subComponents.find((c) => c.name === 'InternalComp')
    expect(internal?.packageName).toBe('package-b')
  })
})
