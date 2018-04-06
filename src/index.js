const path = require('path')
const fs = require('fs-extra')
const { defaultsDeep } = require('lodash')

const {
  parseHosts,
  writeExtensionTemplates,
  enablePlayerDebugMode,
  symlinkExtension,
} = require('./utils')

const { createManifest } = require('./manifest')

module.exports = async bundler => {
  bundler.on('bundled', async bundle => {
    const port = bundler.server.address().port

    await createManifest({ bundle })

    if (bundle.entryAsset.type == 'html') {
      const env = process.env.NODE_ENV

      const out = path.dirname(bundle.name)
      const htmlFilename = path.basename(bundle.entryAsset.parentBundle.name)
      const root = path.dirname(bundle.entryAsset.package.pkgfile)

      const package = require(bundle.entryAsset.package.pkgfile)

      const config = defaultsDeep(
        {
          bundleName: process.env.CEP_NAME,
          bundleId: process.env.CEP_ID,
          bundleVersion: process.env.CEP_VERSION,
          hosts: process.env.CEP_HOSTS,
        },
        {
          bundleName: package.cep && package.cep.name,
          bundleId: package.cep && package.cep.id,
          bundleVersion: package.cep && package.cep.version,
          hosts: package.cep && package.cep.hosts,
        },
        {
          bundleVersion: package.version,
        },
        {
          bundleName: 'My Extension',
          bundleId: 'com.mycompany.myextension',
          bundleVersion: '0.0.1',
          hosts: '*',
        }
      )

      enablePlayerDebugMode()

      const hosts = parseHosts(config.hosts)

      await copyDependencies({
        env,
        out,
        root,
        package: bundle.entryAsset.package,
      })

      await writeExtensionTemplates({
        env,
        hosts,
        port,
        htmlFilename,
        bundleName: config.bundleName,
        bundleId: config.bundleId,
        bundleVersion: config.bundleVersion,
        out,
      })

      await symlinkExtension({ bundleId: config.bundleId, out })
    }
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
