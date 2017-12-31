const path = require('path')

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
    const out = path.dirname(bundle.name)

    logger.status('📦', 'PackageManifestPlugin')
    logger.status('📁', `     out : ${out}`)

    enablePlayerDebugMode()

    const hosts = parseHosts('AEFT')

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
