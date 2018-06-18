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

      const root = process.cwd()
      const package = await bundle.entryAsset.getPackage()

      const config = defaultsDeep(
        {
          bundleName: process.env.NAME,
          bundleId: process.env.ID,
          bundleVersion: process.env.VERSION,
          hosts: process.env.HOSTS,
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
        package,
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
      await copyIcons({ bundle, config })
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

async function copyIcons({ bundle, config }) {
  const outDir = bundle.entryAsset.options.outDir
  const iconPaths = [
    config.iconNormal,
    config.iconRollover,
    config.iconDarkNormal,
    config.iconDarkRollover,
  ]
    .filter(icon => !!icon)
    .map(icon => ({
      source: path.resolve(process.cwd(), icon),
      output: path.join(outDir, path.relative(process.cwd(), icon)),
    }))

  await Promise.all(
    iconPaths.map(async icon => {
      try {
        await fs.copy(icon.source, icon.output)
      } catch (e) {
        console.error(
          `Could not copy ${icon.source}. Ensure the path is correct.`
        )
      }
    })
  )
}
