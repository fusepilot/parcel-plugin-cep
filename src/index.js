const path = require('path')
const fs = require('fs-extra')
const { defaultsDeep } = require('lodash')
const chokidar = require('chokidar');

const {
  parseHosts,
  writeExtensionTemplates,
  enablePlayerDebugMode,
  symlinkExtension,
  copyDependencies,
  copyIcons,
} = require('./utils')

module.exports = async bundler => {
  if (bundler.entryFiles.length === 1 && path.extname(bundler.entryFiles[0]) === '.html') {
    const htmlFilename = path.basename(bundler.entryFiles[0])
    const env = process.env.NODE_ENV
    const port =
      env != 'production' && bundler.server
        ? bundler.server.address().port
        : 1234
    const root = process.cwd()
    const out = bundler.options.outDir
    const package = fs.readJsonSync(path.join(root, 'package.json'))
    const watch = chokidar.watch(path.join(root, 'package.json'), {
      ignored: /(^|[\/\\])\../,
      persistent: true
    });
    watch.on('change', (path) => {
      bundle()
    })
    bundle()
    async function bundle() {
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
      await copyDependencies({ root, out, package })
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
      await copyIcons({ bundler, config })
    }
  }

  // this.watchedDirectories = new Map();
}