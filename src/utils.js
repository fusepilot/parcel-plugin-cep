const { execSync, spawn } = require('child_process')
const path = require('path')
const fs = require('fs-extra')
const os = require('os')
const { range } = require('lodash')

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

const manifestTemplate = require('./templates/manifest')
const panelTemplate = require('./templates/panel')
const debugTemplate = require('./templates/.debug')

async function writeExtensionTemplates({
  env,
  port,
  hosts,
  out,
  htmlFilename,
  bundleName,
  bundleId,
  bundleVersion,
}) {
  const manifestContents = manifestTemplate({
    bundleName,
    bundleId,
    version: bundleVersion,
    hosts,
    bundleVersion,
  })

  await fs.ensureDir(path.join(out, 'CSXS'))
  await fs.writeFile(path.join(out, 'CSXS/manifest.xml'), manifestContents)

  if (env != 'production') {
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

module.exports = {
  enablePlayerDebugMode,
  disablePlayerDebugMode,
  writeExtensionTemplates,
  parseHosts,
  symlinkExtension,
}
