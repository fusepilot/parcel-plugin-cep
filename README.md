# Parcel CEP Plugin

Zero configuration CEP extension builder for [Parcel](https://github.com/parcel-bundler/parcel).

## Quick Start

```sh
git clone https://github.com/fusepilot/parcel-plugin-cep-starter.git
cd parcel-plugin-cep-starter
npm install
npm start
```

Open your CC app of choice, find your extension under `Window` > `Extensions`, and start developing.

### Building

To create a production build:

```sh
npm run build
```

### Packaging

To create a .zxp for deployment:

```sh
npm run zxp
```

A versioned .zxp file will be placed inside `archive`.

## CEP Configuration

You can configure CEP a either through environment variables or the `package.json` of your project.

### package.json

```json
"cep": {
    "name": "My Extension",
    "id": "com.mycompany.myextension",
    "hosts": "*"
}
```

### Environment Variables

Either `set` thorugh your terminal or add to the `.env` file.

```bash
CEP_NAME="My Extension"
CEP_ID="com.mycompany.myextension"
CEP_HOSTS="*"
```

You can find all the available options on the [cep-bundler-core](https://github.com/adobe-extension-tools/cep-bundler-core) readme.

## Communicating with Extendscript

There are few functions that you can import from the `cep-interface` package to ease Extendscript communication from CEP.

#### `loadExtendscript(extendScriptFileName: string): Promise`

Loads and evaluates the specified file in the src/extendscript directory. Returns a promise with the result.

```javascript
import { loadExtendscript } from 'cep-interface'

loadExtendscript('index.jsx')
```

#### `evalExtendscript(code: string): Promise`

Evaluates the specified code. Returns a Promise.

```javascript
import { evalExtendscript } from 'cep-interface'

evalExtendscript('alert("Hello!");') // alerts "Hello!" inside the app
```

If you return a JSON string using [json2](https://github.com/douglascrockford/JSON-js) or similar from Extendscript, you can get the parsed result.

```javascript
import { evalExtendscript } from 'cep-interface'

evalExtendscript('JSON.stringifiy({foo: "bar"});')
  .then(result => console.log(result)) // prints {foo: "bar"}
  .catch(error => console.warn(error))
```

## Other functions

There are a few other functions available in addition.

#### `openURLInDefaultBrowser(url: string)`

```javascript
import { openURLInDefaultBrowser } from 'cep-interface'

openURLInDefaultBrowser('www.google.com')
```

Opens the url in the default browser. Will also work when viewing outside the target application in a browser.
