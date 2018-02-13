const path = require('path')
const fs = require('fs-extra')

const {
  parseHosts,
  writeExtensionTemplates,
  enablePlayerDebugMode,
  symlinkExtension,
} = require('./utils')

const bundleName = 'My Extension'
const bundleId = 'my.extension'
const bundleVersion = '1.0.0'

module.exports = async bundler => {
  const logger = bundler.logger
  // logger.status('🖊', 'update manifest file')
  // bundler.addAssetType('.js', require.resolve('./assets'))
  // bundler.addPackager('foo', require.resolve('./MyPackager'));

  bundler.on('bundled', async bundle => {
    const env = process.env.NODE_ENV

    const out = path.dirname(bundle.name)
    const root = path.dirname(bundle.entryAsset.package.pkgfile)

    logger.status('📦', 'PackageManifestPlugin')
    logger.status('📁', `     out : ${out}`)

    enablePlayerDebugMode()

    const hosts = parseHosts('AEFT')

    await copyDependencies({
      env,
      out,
      root,
      package: bundle.entryAsset.package,
    })

    await writeExtensionTemplates({
      env: 'dev',
      hosts,
      port: 1234,
      bundleName,
      bundleId,
      bundleVersion,
      out,
    })

    await symlinkExtension({ bundleId, out })
  })
}

async function copyDependencies({ env, out, root, package }) {
  await fs.remove(`${out}/node_modules`)
  await fs.mkdirp(`${out}/node_modules`)

  let copyFunction = fs.ensureSymlink
  if (env == 'production') copyFunction = fs.copy

  const deps = package.dependencies || {}
  for (const dep of Object.keys(deps)) {
    await copyFunction(
      `${root}/node_modules/${dep}`,
      `${out}/node_modules/${dep}`
    )
  }
}
