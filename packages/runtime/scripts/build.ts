import esbuild from 'esbuild'
import { RUNTIME_BUNDLES, getBundleOptions } from './bundleConfig'

Promise.all(
  Object.keys(RUNTIME_BUNDLES).map((name) =>
    esbuild.build(getBundleOptions(name)),
  ),
).catch(() => process.exit(1))
