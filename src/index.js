const path = require('path')
const fs = require('fs-extra')
const chokidar = require('chokidar');

const {
  parseHosts,
  writeExtensionTemplates,
  enablePlayerDebugMode,
  symlinkExtension,
  copyDependencies,
  copyIcons,
  getConfig,
  objectToProcessEnv,
} = require('./utils')

module.exports = async bundler => {
  const root = process.cwd()
  // load package.json
  const package = fs.readJsonSync(path.join(root, 'package.json'))
  // load config
  const config = getConfig(package)
  // assign config values to process.env
  objectToProcessEnv(config)
  // only run when the process is the one bundling the .html file
  if (bundler.entryFiles.length === 1 && path.extname(bundler.entryFiles[0]) === '.html') {
    const htmlFilename = path.basename(bundler.entryFiles[0])
    const env = process.env.NODE_ENV
    const port =
      env != 'production' && bundler.server
        ? bundler.server.address().port
        : 1234
    const out = bundler.options.outDir
    // listen for changes to the package.json (that might have gotten changes to cep config values) and re-bundle
    const watch = chokidar.watch(path.join(root, 'package.json'), {
      ignored: /(^|[\/\\])\../,
      persistent: true
    });
    watch.on('change', (path) => {
      bundle()
    })
    bundler.on('buildEnd', () => {
      watch.close()
    })
    bundle()
    async function bundle() {
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
        debugInProduction: config.debugInProduction,
        out,
      })
      await copyIcons({ bundler, config })

      if (env !== 'production') {
        enablePlayerDebugMode()
        await symlinkExtension({ bundleId: config.bundleId, out })
      }
    }
  }
}

