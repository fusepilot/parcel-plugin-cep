const { execSync, spawn } = require('child_process')
const path = require('path')
const fs = require('fs-extra')

function enablePlayerDebugMode() {
  // enable unsigned extensions for the foreseable future
  execSync(
    `
    defaults write com.adobe.CSXS.15 PlayerDebugMode 1;
    defaults write com.adobe.CSXS.14 PlayerDebugMode 1;
    defaults write com.adobe.CSXS.13 PlayerDebugMode 1;
    defaults write com.adobe.CSXS.12 PlayerDebugMode 1;
    defaults write com.adobe.CSXS.11 PlayerDebugMode 1;
    defaults write com.adobe.CSXS.10 PlayerDebugMode 1;
    defaults write com.adobe.CSXS.9 PlayerDebugMode 1;
    defaults write com.adobe.CSXS.8 PlayerDebugMode 1;
    defaults write com.adobe.CSXS.7 PlayerDebugMode 1;
    defaults write com.adobe.CSXS.6 PlayerDebugMode 1;
    defaults write com.adobe.CSXS.5 PlayerDebugMode 1;
    defaults write com.adobe.CSXS.4 PlayerDebugMode 1;
  `
  )
}

function disablePlayerDebugMode() {
  // disable unsigned extensions for the foreseable future
  execSync(
    `
    defaults write com.adobe.CSXS.15 PlayerDebugMode 0;
    defaults write com.adobe.CSXS.14 PlayerDebugMode 0;
    defaults write com.adobe.CSXS.13 PlayerDebugMode 0;
    defaults write com.adobe.CSXS.12 PlayerDebugMode 0;
    defaults write com.adobe.CSXS.11 PlayerDebugMode 0;
    defaults write com.adobe.CSXS.10 PlayerDebugMode 0;
    defaults write com.adobe.CSXS.9 PlayerDebugMode 0;
    defaults write com.adobe.CSXS.8 PlayerDebugMode 0;
    defaults write com.adobe.CSXS.7 PlayerDebugMode 0;
    defaults write com.adobe.CSXS.6 PlayerDebugMode 0;
    defaults write com.adobe.CSXS.5 PlayerDebugMode 0;
    defaults write com.adobe.CSXS.4 PlayerDebugMode 0;
  `
  )
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

  const debugContents = debugTemplate(bundleId, hosts)
  await fs.writeFile(path.join(out, '.debug'), debugContents)

  const href = env == 'production' ? htmlFilename : `http://localhost:${port}`
  const panelContents = panelTemplate({
    title: bundleName,
    href,
  })
  fs.writeFileSync(path.join(out, 'panel.html'), panelContents)
}

function parseHosts(hostsString) {
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
  return '/Library/Application Support/Adobe/CEP/extensions'
}

function getSymlinkExtensionPath({ bundleId }) {
  const extensionPath = getExtenstionPath()
  return path.join(process.env.HOME, extensionPath, bundleId)
}

async function symlinkExtension({ bundleId, out }) {
  await fs.ensureDir(getExtenstionPath())
  let target = getSymlinkExtensionPath({ bundleId })
  await fs.remove(target)
  await fs.symlink(path.join(out, '/'), target)
}

module.exports = {
  enablePlayerDebugMode,
  disablePlayerDebugMode,
  writeExtensionTemplates,
  parseHosts,
  symlinkExtension,
}
