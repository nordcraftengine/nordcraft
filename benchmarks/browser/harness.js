const params = new URLSearchParams(window.location.search)
const version = params.get('version') || 'head'

let project
let nordcraftProject
let customElementRuntime

async function loadFixture(url, name) {
  const [runtime, fixture] = await Promise.all([
    import(`/bundle/${version}/page.main.esm.js?fixture=${name}`),
    fetch(url).then((r) => r.json()),
  ])
  // Strip APIs to guarantee 100% offline, zero-network deterministic execution
  for (const comp of Object.values(fixture.files.components)) {
    comp.apis = {}
  }
  fixture.runtime = runtime
  return fixture
}

async function initHarness() {
  const [loadedProject, loadedNordcraft] = await Promise.all([
    loadFixture('/fixtures/benchmark-project.json', 'benchmark'),
    loadFixture('/fixtures/nordcraft.com.json', 'nordcraft'),
  ])
  project = loadedProject
  nordcraftProject = loadedNordcraft

  try {
    customElementRuntime = await import(
      `/bundle/${version}/custom-element.main.esm.js`
    )
  } catch (err) {
    console.warn('Custom element runtime could not be loaded:', err)
  }

  window.__nordcraftProject = nordcraftProject
  window.__benchmarkProject = project
  window.__harnessReady = true
}

function getFrontPage(fixture) {
  // In nordcraft.com.json the front page is called "nordcraft" (not "HomePage")
  if (fixture.files.components.nordcraft) {
    return fixture.files.components.nordcraft
  }
  if (fixture.files.components.HomePage) {
    return fixture.files.components.HomePage
  }
  throw new Error('Front page component not found in fixture')
}

function setupPage(fixture, pageName, pageState = {}) {
  const pageComp = pageName
    ? fixture.files.components[pageName]
    : getFrontPage(fixture)
  if (!pageComp) {
    throw new Error(`Component "${pageName}" not found in project`)
  }

  const comp = structuredClone(pageComp)
  window.__toddle = {
    project: fixture.project?.short_id || fixture.name || 'nordcraft',
    branch: 'main',
    commit: 'bench',
    pageState: {
      Apis: {},
      Parameters: {},
      Variables: {},
      ...pageState,
    },
    component: comp,
    components: Object.values(fixture.files.components),
    isPageLoaded: false,
    cookies: [],
  }
  window.__toddle.components = [comp, ...window.__toddle.components]

  fixture.runtime.initGlobalObject({ formulas: {}, actions: {} })
  return comp
}

function setupNordcraftPage(pageName = 'nordcraft') {
  return setupPage(nordcraftProject, pageName)
}

function setupShufflePage() {
  return setupPage(project, 'ShufflePage')
}

function setupLifecyclePage() {
  return setupPage(project, 'LifecyclePage')
}

function setupStylesPage() {
  return setupPage(project, 'StylesPage')
}

function setupContextPage() {
  return setupPage(project, 'ContextPage')
}

function setupSyntheticEnvironment(itemsCount = 50) {
  const items = Array.from({ length: itemsCount }, (_, i) => ({
    id: `item-${i}`,
    title: `Benchmark Item ${i}`,
  }))

  const comp = setupPage(project, undefined, {
    Variables: {
      items,
      count: 0,
    },
  })
  comp.variables.items.initialValue.value = items
}

const cases = {
  /**
   * Scenario 1: mount-nordcraft
   * Mounts the official front page ("nordcraft") of nordcraft.com
   * (213 components, 2,500+ DOM nodes, 5,500+ formulas).
   */
  async 'mount-nordcraft'() {
    const app = document.getElementById('App')
    app.replaceChildren()
    setupNordcraftPage('nordcraft')
    nordcraftProject.runtime.createRoot(app)
  },

  /**
   * Scenario 2: mount-pricing
   * Mounts the official "pricing" page of nordcraft.com
   * (169 nodes, feature tables, accordion, and pricing formulas).
   */
  async 'mount-pricing'() {
    const app = document.getElementById('App')
    app.replaceChildren()
    setupNordcraftPage('pricing')
    nordcraftProject.runtime.createRoot(app)
  },

  /**
   * Scenario 3: reactive-clicks
   * Measures 2,000 consecutive clicks: event handling, action dispatch,
   * signal propagation, and formula-bound DOM text updates.
   */
  async 'reactive-clicks'() {
    const app = document.getElementById('App')
    app.replaceChildren()
    setupSyntheticEnvironment(20)
    project.runtime.createRoot(app)

    const incBtn = document.getElementById('btn-inc')
    if (!incBtn) {
      throw new Error('btn-inc not found')
    }

    for (let i = 0; i < 2000; i++) {
      incBtn.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true }),
      )
    }

    const display = document.getElementById('count-value')
    if (!display?.textContent?.includes('2000')) {
      throw new Error(
        `Expected count to be 2000, got "${display?.textContent}"`,
      )
    }
  },

  /**
   * Scenario 4: list-repeat
   * Measures repeated node reconciliation: 15 cycles of populating 200 items
   * and clearing them.
   */
  async 'list-repeat'() {
    const app = document.getElementById('App')
    app.replaceChildren()
    setupSyntheticEnvironment(10)
    project.runtime.createRoot(app)

    const populateBtn = document.getElementById('btn-populate-list')
    const clearBtn = document.getElementById('btn-clear-list')
    const listUl = document.getElementById('benchmark-list')
    if (!populateBtn || !clearBtn || !listUl) {
      throw new Error('List benchmark buttons or ul not found')
    }

    for (let i = 0; i < 15; i++) {
      populateBtn.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true }),
      )
      clearBtn.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true }),
      )
    }
  },

  /**
   * Scenario 5: custom-element
   * Measures custom element definition and mounting 200 instances.
   */
  async 'custom-element'() {
    if (!customElementRuntime?.defineComponents) {
      return
    }

    const app = document.getElementById('App')
    app.replaceChildren()

    if (!window.toddle) {
      setupPage(project)
    }

    const counterComp = structuredClone(project.files.components.counter)
    if (!customElements.get('toddle-counter')) {
      customElementRuntime.defineComponents(
        ['counter'],
        {
          components: [counterComp],
          themes: {},
        },
        window.toddle,
      )
    }

    for (let i = 0; i < 200; i++) {
      const el = document.createElement('toddle-counter')
      app.appendChild(el)
    }
  },

  /**
   * Scenario 6: repeat-list-shuffle
   * Renders 200 repeat items from a Range formula (each with a unique
   * repeat-key and two sortable columns) and measures how quickly the DOM
   * reorders the list across 20 clicks that alternate the sort column.
   */
  async 'repeat-list-shuffle'() {
    const app = document.getElementById('App')
    app.replaceChildren()
    setupShufflePage()
    project.runtime.createRoot(app)

    const sortBtn = document.getElementById('btn-sort-list')
    const listUl = document.getElementById('benchmark-shuffle-list')
    if (!sortBtn || !listUl) {
      throw new Error('Shuffle benchmark button or ul not found')
    }
    if (listUl.children.length !== 200) {
      throw new Error(`Expected 200 items, got ${listUl.children.length}`)
    }

    const getOrder = () =>
      Array.from(listUl.children)
        .map((el) => el.getAttribute('data-id'))
        .join(',')

    const orderBefore = getOrder()
    for (let i = 0; i < 20; i++) {
      sortBtn.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true }),
      )
    }

    if (listUl.children.length !== 200) {
      throw new Error(
        `Expected 200 items after shuffle, got ${listUl.children.length}`,
      )
    }
    if (getOrder() === orderBefore) {
      throw new Error('List order did not change after sorting')
    }
  },

  /**
   * Scenario 7: lifecycle-churn
   * Measures 30 cycles of mounting and unmounting a 30+ node conditional
   * component subtree with nested components, repeat lists, formulas, and event listeners.
   */
  async 'lifecycle-churn'() {
    const app = document.getElementById('App')
    app.replaceChildren()
    setupLifecyclePage()
    project.runtime.createRoot(app)

    const toggleBtn = document.getElementById('btn-toggle-lifecycle')
    if (!toggleBtn) {
      throw new Error('btn-toggle-lifecycle not found')
    }

    for (let i = 0; i < 30; i++) {
      toggleBtn.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true }),
      )
    }

    const container = document.getElementById('lifecycle-container')
    if (container) {
      throw new Error(
        'Expected lifecycle-container to be unmounted after 30 toggles',
      )
    }
  },

  /**
   * Scenario 8: style-variables
   * Measures 40 cycles of updating dynamic CSS custom properties
   * across 200 repeated elements via CustomPropertyStyleSheet.
   */
  async 'style-variables'() {
    const app = document.getElementById('App')
    app.replaceChildren()
    setupStylesPage()
    project.runtime.createRoot(app)

    const cycleBtn = document.getElementById('btn-cycle-styles')
    const list = document.getElementById('styles-list')
    if (!cycleBtn || !list) {
      throw new Error('Styles benchmark button or list not found')
    }
    if (list.children.length !== 200) {
      throw new Error(`Expected 200 items, got ${list.children.length}`)
    }

    for (let i = 0; i < 40; i++) {
      cycleBtn.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true }),
      )
    }
  },

  /**
   * Scenario 9: context-propagation
   * Measures 40 cycles of updating a root context provider and propagating
   * the new context values down to 200 deeply nested consumer components.
   */
  async 'context-propagation'() {
    const app = document.getElementById('App')
    app.replaceChildren()
    setupContextPage()
    project.runtime.createRoot(app)

    const toggleBtn = document.getElementById('btn-toggle-context')
    const list = document.getElementById('context-consumer-list')
    if (!toggleBtn || !list) {
      throw new Error('Context benchmark button or list not found')
    }
    if (list.children.length !== 200) {
      throw new Error(`Expected 200 consumers, got ${list.children.length}`)
    }

    for (let i = 0; i < 40; i++) {
      toggleBtn.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true }),
      )
    }

    const firstItem = list.firstElementChild
    if (!firstItem?.textContent?.includes('light-mode')) {
      throw new Error(
        `Expected consumer to have 'light-mode', got '${firstItem?.textContent}'`,
      )
    }
  },
}

window.__runCase = async function (caseId) {
  if (!cases[caseId]) {
    throw new Error(`Unknown benchmark case: ${caseId}`)
  }
  if (window.gc) window.gc()
  const memBefore = performance.memory ? performance.memory.usedJSHeapSize : 0
  const t0 = performance.now()
  await cases[caseId]()
  const t1 = performance.now()
  const memAfter = performance.memory ? performance.memory.usedJSHeapSize : 0

  return {
    timeMs: t1 - t0,
    heapDeltaKb: Math.max(0, (memAfter - memBefore) / 1024),
  }
}

window.__warmupCase = async function (caseId, count = 5) {
  for (let i = 0; i < count; i++) {
    await window.__runCase(caseId)
  }
}

initHarness().catch((err) => {
  console.error('Failed to init harness:', err)
})
