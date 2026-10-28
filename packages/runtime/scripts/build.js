const esbuild = require('esbuild')
const { RUNTIME_BUNDLES, getBundleOptions } = require('./bundleConfig')

Promise.all(
  Object.keys(RUNTIME_BUNDLES).map((name) =>
    esbuild.build(getBundleOptions(name)),
  ),
).catch(() => process.exit(1))
