const params = new URLSearchParams(window.location.search)
const fixtureName = params.get('fixture')

window.__e2e = { ready: false, error: null }

const boot = async () => {
  if (!fixtureName) {
    throw new Error('Missing the "fixture" query parameter')
  }

  const [runtime, fixture] = await Promise.all([
    import('/runtime/page.main.esm.js'),
    import(`/fixtures/${fixtureName}.js`),
  ])

  const component = fixture.components.find(
    (candidate) => candidate.name === fixture.page,
  )
  if (!component) {
    throw new Error(`Page "${fixture.page}" was not found in the fixture`)
  }

  window.__toddle = {
    project: 'e2e',
    branch: 'main',
    commit: 'e2e',
    pageState: {
      Apis: {},
      Parameters: {},
      Variables: {},
    },
    component,
    components: fixture.components,
    isPageLoaded: false,
    cookies: [],
  }

  runtime.initGlobalObject({ formulas: {}, actions: {} })
  runtime.createRoot(document.getElementById('app'))
  window.__e2e.ready = true
}

boot().catch((error) => {
  window.__e2e.error = error instanceof Error ? error.message : String(error)
  console.error(error)
})
