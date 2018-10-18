# Parcel CEP Plugin

Zero configuration CEP extension builder for [Parcel](https://github.com/parcel-bundler/parcel).

## Quick Start

```sh
git clone https://github.com/fusepilot/parcel-plugin-cep-starter.git
cd parcel-plugin-cep-starter
npm
npm run start
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
NAME="My Extension"
BUNDLE_ID="com.mycompany.myextension"
HOSTS="*"
```

### Options

#### Id

This is the unique id of the extension.

#### Version

This sets the version of the bundle.

#### Name

This sets the name of extension as it will show in the application.

#### Hosts

By default, the extension will target all known Adobe hosts. To target specific hosts, uncomment the `HOSTS` variable to `.env` and modify the list of the hosts you want to target.

For example, to target just Illustrator and After Effects, you would add this to your `.env` file:

```bash
HOSTS="ILST, AEFT"
```

And to target specific versions:

```bash
HOSTS="ILST, IDSN@*, PHXS@6.0, AEFT@[5.0,10.0]"
```

This will target all versions of Illustrator and In Design, Photoshop 6.0, and After Effects 5.0 - 10.0.

#### Icon

To add a custom panel icon, add all [icon files](https://github.com/Adobe-CEP/CEP-Resources/blob/master/CEP_8.x/Documentation/CEP%208.0%20HTML%20Extension%20Cookbook.md#high-dpi-panel-icons) inside the `public` folder and set their paths inside your `.env` file:

```bash
ICON_NORMAL="./assets/icon-normal.png"
ICON_ROLLOVER="./assets/icon-rollover.png"
ICON_DARK_NORMAL="./assets/icon-dark.png"
ICON_DARK_ROLLOVER="./assets/icon-dark-rollover.png"
```

#### Cerificate Signing

In order to create a valid ZXP, you will need to provide the following variables replaced with the correct information inside your `.env`.

```bash
CERTIFICATE_COUNTRY="US"
CERTIFICATE_PROVINCE="CA"
CERTIFICATE_ORG="MyCompany"
CERTIFICATE_NAME="com.mycompany"
CERTIFICATE_PASSWORD="mypassword"
```

#### Panel Size

```bash
PANEL_WIDTH=500
PANEL_HEIGHT=500
```

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
