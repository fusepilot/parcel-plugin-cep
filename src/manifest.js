const path = require('path')
const fs = require('fs-extra')

async function readManifestJson({ manifestPath, logger }) {
  const manifestPathExists = await fs.existsSync(manifestPath)
  if (!manifestPathExists) {
    logger.status('✨', 'create manifest file')
    return {}
  }

  logger.status('🖊', 'update manifest file')

  try {
    const manifestRaw = await fs.readFile(manifestPath, 'utf8')
    return JSON.parse(manifestRaw)
  } catch (e) {
    logger.error('manifest file is invalid')
    throw e
  }
}

async function feedManifestValue({ bundle, manifestValue, publicURL, logger }) {
  let output = path.relative(
    publicURL,
    path.join(publicURL, path.basename(bundle.name))
  )

  let input = bundle.entryAsset
    ? bundle.entryAsset.basename
    : bundle.assets.values().next().value.basename

  manifestValue[input] = output

  logger.status('✓', `  bundle : ${input} => ${output}`)

  bundle.childBundles.forEach(async function(childBundle) {
    if (childBundle.type == 'map') return

    await feedManifestValue({
      bundle: childBundle,
      manifestValue,
      publicURL,
      logger,
    })
  })
}

async function createManifest({ bundle, name = 'manifest.json', logger }) {
  const dir = bundle.entryAsset.options.outDir
  const publicURL = bundle.entryAsset.options.publicURL

  const manifestPath = path.resolve(dir, name)
  const manifestValue = await readManifestJson({ manifestPath, logger })

  logger.status('📦', 'PackageManifestPlugin')
  await feedManifestValue({ bundle, manifestValue, publicURL, logger })
  logger.status('📄', `manifest : ${manifestPath}`)

  await fs.writeFile(manifestPath, JSON.stringify(manifestValue))
}

module.exports = {
  createManifest,
}
