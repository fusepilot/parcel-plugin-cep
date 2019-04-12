const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs-extra')
const os = require('os')
const { range } = require('lodash')
const { defaultsDeep } = require('lodash')

const manifestTemplate = require('./templates/manifest')
const panelTemplate = require('./templates/panel')
const debugTemplate = require('./templates/.debug')

function templateDebug(formatter) {
  return range(4, 16)
    .map(formatter)
    .join(os.EOL)
}

function enablePlayerDebugMode() {
  // enable unsigned extensions for the foreseable future
  if (process.platform === 'darwin') {
    execSync(
      templateDebug(i => `defaults write com.adobe.CSXS.${i} PlayerDebugMode 1`)
    )
  } else if (process.platform === 'win32') {
    execSync(
      templateDebug(
        i =>
          `REG ADD HKCU\\Software\\Adobe\\CSXS.${i} /f /v PlayerDebugMode /t REG_SZ /d 1`
      )
    )
  }
}

function disablePlayerDebugMode() {
  // disable unsigned extensions for the foreseable future
  if (process.platform === 'darwin') {
    execSync(
      templateDebug(i => `defaults write com.adobe.CSXS.${i} PlayerDebugMode 0`)
    )
  } else if (process.platform === 'win32') {
    execSync(
      templateDebug(
        i => `REG DELETE HKCU\\Software\\Adobe\\CSXS.${i} /f /v PlayerDebugMode`
      )
    )
  }
}

function camelToSnake(str) {
  return str.replace(/([A-Z])/g, (part) => `_${part.toLowerCase()}`)
}

function isTruthy(str) {
  return typeof str === 'string' && (str === '1' || str.toLowerCase() === 'true')
}

function getConfig(package) {
  const debugPortEnvs = Object.keys(process.env)
    .filter((key) => key.indexOf('DEBUG_PORT_') === 0)
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
      debugPorts: debugPortEnvs.length > 0
        ? debugPortEnvs.reduce((obj, key) => {
          obj[key] = parseInt(process.env[key], 10)
          return obj
        }, {})
        : undefined,
      debugInProduction: isTruthy(process.env.DEBUG_IN_PRODUCTION),
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
      debugPorts: package.cep.debugPorts,
      debugInProduction: package.cep.debugInProduction,
      lifecycle: package.cep.lifecycle,
    },
    {
      bundleVersion: package.version,
    },
    {
      bundleName: 'Parcel CEP Extension',
      bundleId: 'com.mycompany.myextension',
      bundleVersion: '0.0.1',
      hosts: '*',
      panelWidth: 500,
      panelHeight: 500,
      debugInProduction: false,
      debugPorts: {
        PHXS: 3001,
        IDSN: 3002,
        AICY: 3003,
        ILST: 3004,
        PPRO: 3005,
        PRLD: 3006,
        AEFT: 3007,
        FLPR: 3008,
        AUDT: 3009,
        DRWV: 3010,
        MUST: 3011,
        KBRG: 3012,
      },
      lifecycle: {autoVisible: true, startOnEvents: []},
    }
  )
  return config
}

function objectToProcessEnv(object) {
  // assign object to process.env so they can be used in the code
  Object.keys(object).forEach(key => {
    const envKey = camelToSnake(key).toUpperCase()
    const value = typeof object[key] === 'string'
      ? object[key]
      : JSON.stringify(object[key])
    process.env[envKey] = value
  })
}

async function writeExtensionTemplates({
  env,
  port,
  hosts,
  out,
  htmlFilename,
  bundleName,
  bundleId,
  bundleVersion,
  iconNormal,
  iconRollover,
  iconDarkNormal,
  iconDarkRollover,
  panelWidth,
  panelHeight,
  debugInProduction,
  lifecycle,
}) {
  const manifestContents = manifestTemplate({
    bundleName,
    bundleId,
    version: bundleVersion,
    hosts,
    bundleVersion,
    iconNormal,
    iconRollover,
    iconDarkNormal,
    iconDarkRollover,
    panelWidth,
    panelHeight,
    lifecycle,
  })

  await fs.ensureDir(path.join(out, 'CSXS'))
  await fs.writeFile(path.join(out, 'CSXS/manifest.xml'), manifestContents)

  if (debugInProduction || process.env.NODE_ENV !== 'production') {
    const debugContents = debugTemplate(bundleId, hosts)
    await fs.writeFile(path.join(out, '.debug'), debugContents)
  }

  const href = env == 'production' ? htmlFilename : `http://localhost:${port}`
  const panelContents = panelTemplate({
    title: bundleName,
    href,
  })
  fs.writeFileSync(path.join(out, 'panel.html'), panelContents)
}

function parseHosts(hostsString) {
  if (hostsString == '*')
    hostsString = `PHXS, IDSN, AICY, ILST, PPRO, PRLD, AEFT, FLPR, AUDT, DRWV, MUST, KBRG`
  const hosts = hostsString
    .split(/(?![^)(]*\([^)(]*?\)\)),(?![^\[]*\])/)
    .map(host => host.trim())
    .map(host => {
      let [name, version] = host.split('@')

      if (version == '*' || !version) {
        version = '[0.0,99.9]'
      } else if (version) {
        version = version
      }
      return {
        name,
        version,
      }
    })

  return hosts
}

function getExtenstionPath() {
  if (process.platform == 'darwin') {
    return path.join(
      os.homedir(),
      '/Library/Application Support/Adobe/CEP/extensions'
    )
  } else if (process.platform == 'win32') {
    return path.join(process.env.APPDATA, 'Adobe/CEP/extensions')
  }
}

function getSymlinkExtensionPath({ bundleId }) {
  const extensionPath = getExtenstionPath()
  return path.join(extensionPath, bundleId)
}

async function symlinkExtension({ bundleId, out }) {
  await fs.ensureDir(getExtenstionPath())
  let target = getSymlinkExtensionPath({ bundleId })
  await fs.remove(target)
  if (process.platform === 'win32') {
    await fs.symlink(path.join(out, '/'), target, 'junction')
  } else {
    await fs.symlink(path.join(out, '/'), target)
  }
}

async function copyDependencies({ root, out, package }) {
  const deps = package.dependencies || {}
  for (const dep of Object.keys(deps)) {
    try {
      const src = path.join(root, 'node_modules', dep)
      const dest = path.join(out, 'node_modules', dep)
      await fs.copy(src, dest)
    } catch (err) {
      console.error('Error while copying', err)
    }
    await copyDependencies({
      root,
      out,
      package: fs.readJsonSync(path.join(root, 'node_modules', dep, 'package.json'))
    })
  }
}

async function copyIcons({ bundler, config }) {
  const outDir = bundler.options.outDir
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

module.exports = {
  copyDependencies,
  copyIcons,
  enablePlayerDebugMode,
  disablePlayerDebugMode,
  writeExtensionTemplates,
  parseHosts,
  symlinkExtension,
  getConfig,
  objectToProcessEnv,
}
