const path = require('path')
const fs = require('fs')
const chokidar = require('chokidar');
const { compile } = require('cep-bundler-core')

module.exports = async bundler => {
  const root = process.cwd()
  // load package.json
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
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
    function bundle() {
      compile({
        out: out,
        devPort: port,
        devHost: 'localhost',
        env: env,
        root: root,
        htmlFilename: htmlFilename,
        pkg: pkg,
        isDev: env !== 'production'
      })
    }
  }
}

