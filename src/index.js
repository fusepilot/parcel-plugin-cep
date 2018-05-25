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
    await createManifest({ bundle })

    if (bundle.entryAsset.type == 'html') {
      const env = process.env.NODE_ENV
      const port =
        env != 'production' && bundler.server
          ? bundler.server.address().port
          : 1234

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
          iconNormal: process.env.ICON_NORMAL,
          iconRollover: process.env.ICON_ROLLOVER,
          iconDarkNormal: process.env.ICON_DARK_NORMAL,
          iconDarkRollover: process.env.ICON_DARK_ROLLOVER,
          panelWidth: process.env.PANEL_WIDTH,
          panelHeight: process.env.PANEL_HEIGHT,
        },
        {
          bundleName: package.cep && package.cep.name,
          bundleId: package.cep && package.cep.id,
          bundleVersion: package.cep && package.cep.version,
          hosts: package.cep && package.cep.hosts,
          iconNormal: package.cep.iconNormal,
          iconRollover: package.cep.iconRollover,
          iconDarkNormal: package.cep.iconDarkNormal,
          iconDarkRollover: package.cep.iconDarkRollover,
          panelWidth: package.cep.panelWidth,
          panelHeight: package.cep.panelHeight,
        },
        {
          bundleVersion: package.version,
        },
        {
          bundleName: 'My Extension',
          bundleId: 'com.mycompany.myextension',
          bundleVersion: '0.0.1',
          hosts: '*',
          panelWidth: 500,
          panelHeight: 500,
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
        iconNormal: config.iconNormal,
        iconRollover: config.iconRollover,
        iconDarkNormal: config.iconDarkNormal,
        iconDarkRollover: config.iconDarkRollover,
        panelWidth: config.panelWidth,
        panelHeight: config.panelHeight,
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
