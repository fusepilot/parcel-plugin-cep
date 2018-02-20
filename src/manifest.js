const path = require('path')
const fs = require('fs-extra')

async function readManifestJson({ manifestPath }) {
  const manifestPathExists = await fs.existsSync(manifestPath)
  if (!manifestPathExists) return {}

  try {
    const manifestRaw = await fs.readFile(manifestPath, 'utf8')
    return JSON.parse(manifestRaw)
  } catch (e) {
    console.error('manifest file is invalid')
    throw e
  }
}

async function feedManifestValue({ bundle, manifestValue, publicURL }) {
  let output = path.relative(
    publicURL,
    path.join(publicURL, path.basename(bundle.name))
  )

  let input = bundle.entryAsset
    ? bundle.entryAsset.basename
    : bundle.assets.values().next().value.basename

  manifestValue[input] = output

  bundle.childBundles.forEach(async function(childBundle) {
    if (childBundle.type == 'map') return

    await feedManifestValue({
      bundle: childBundle,
      manifestValue,
      publicURL,
    })
  })
}

async function createManifest({ bundle, name = 'manifest.json' }) {
  const dir = bundle.entryAsset.options.outDir
  const publicURL = bundle.entryAsset.options.publicURL

  const manifestPath = path.resolve(dir, name)
  const manifestValue = await readManifestJson({ manifestPath })

  await feedManifestValue({ bundle, manifestValue, publicURL })

  await fs.writeFile(manifestPath, JSON.stringify(manifestValue))
}

module.exports = {
  createManifest,
}
