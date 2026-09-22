const params = new URLSearchParams(window.location.search)
const version = params.get('version') || 'head'

let runtime
let project
let nordcraftProject
let customElementRuntime

async function initHarness() {
  const [loadedRuntime, loadedProject, loadedNordcraft] = await Promise.all([
    import(`/bundle/${version}/page.main.esm.js`),
    fetch('/fixtures/benchmark-project.json').then((r) => r.json()),
    fetch('/fixtures/nordcraft.com.json').then((r) => r.json()),
  ])
  runtime = loadedRuntime
  project = loadedProject

  // Merge benchmark components into nordcraftProject so all components exist in the same unified project dictionary
  Object.assign(
    loadedNordcraft.files.components,
    loadedProject.files.components,
  )

  // Strip APIs to guarantee 100% offline, zero-network deterministic execution
  for (const comp of Object.values(loadedNordcraft.files.components)) {
    comp.apis = {}
  }
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

function setupNordcraftPage(pageName = 'nordcraft') {
  const pageComp = nordcraftProject.files.components[pageName]
  if (!pageComp) {
    throw new Error(
      `Component "${pageName}" not found in nordcraft.com project`,
    )
  }
  window.__toddle = {
    project: 'nordcraft',
    branch: 'main',
    commit: 'bench',
    pageState: {
      Apis: {},
      Parameters: {},
      Variables: {},
    },
    component: pageComp,
    components: Object.values(nordcraftProject.files.components),
    isPageLoaded: false,
    cookies: [],
  }
  window.__toddle.components = [pageComp, ...window.__toddle.components]

  runtime.initGlobalObject({ formulas: {}, actions: {} })
}

function setupSyntheticEnvironment(itemsCount = 50) {
  const comp = structuredClone(project.files.components.HomePage)
  const items = Array.from({ length: itemsCount }, (_, i) => ({
    id: `item-${i}`,
    title: `Benchmark Item ${i}`,
  }))
  comp.variables.items.initialValue.value = items

  window.__toddle = {
    project: 'nordcraft',
    branch: 'main',
    commit: 'bench-run',
    pageState: {
      Apis: {},
      Parameters: {},
      Variables: {
        items,
        count: 0,
      },
    },
    component: comp,
    components: Object.values(nordcraftProject.files.components),
    isPageLoaded: false,
    cookies: [],
  }
  window.__toddle.components = [comp, ...window.__toddle.components]

  runtime.initGlobalObject({ formulas: {}, actions: {} })
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
    runtime.createRoot(app)
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
    runtime.createRoot(app)
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
    runtime.createRoot(app)

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
    runtime.createRoot(app)

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

await initHarness()
