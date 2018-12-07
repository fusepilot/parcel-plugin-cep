module.exports = function({
  bundleName = 'My Extension',
  bundleId = 'com.test.test.extension',
  version = '1.0.0',
  hosts,
  bundleVersion = '1.0.0',
  cepVersion = '6.0',
  panelWidth = '500',
  panelHeight = '500',
  panelMinWidth = undefined,
  panelMinHeight = undefined,
  panelMaxWidth = undefined,
  panelMaxHeight = undefined,
  cefParams = [
    '--allow-file-access-from-files',
    '--allow-file-access',
    '--enable-nodejs',
  ],
  iconNormal,
  iconRollover,
  iconDarkNormal,
  iconDarkRollover,
}) {
  var commandLineParams = cefParams.map(
    cefParam => `<Parameter>${cefParam}</Parameter>`
  )

  var icons = [
    { icon: iconNormal, type: 'Normal' },
    { icon: iconRollover, type: 'RollOver' },
    { icon: iconDarkNormal, type: 'DarkNormal' },
    { icon: iconDarkRollover, type: 'DarkRollOver' },
  ]
    .filter(({ icon }) => !!icon)
    .map(({ icon, type }) => `<Icon Type="${type}">${icon}</Icon>`)
    .join('\n            ')

  var sizeTemplate = (name, width, height) =>
    width !== undefined && height !== undefined ? `
            <${name}>
              <Width>${width}</Width>
              <Height>${height}</Height>
            </${name}>` : '';
  var size = sizeTemplate('Size', panelWidth, panelHeight);
  var minSize = sizeTemplate('MinSize', panelMinWidth, panelMinHeight);
  var maxSize = sizeTemplate('MaxSize', panelMaxWidth, panelMaxHeight);

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<ExtensionManifest xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ExtensionBundleId="${bundleId}" ExtensionBundleName="${bundleName}" ExtensionBundleVersion="${bundleVersion}" Version="${cepVersion}">
  <ExtensionList>
    <Extension Id="${bundleId}" Version="${version}"/>
  </ExtensionList>
  <ExecutionEnvironment>
    <HostList>
      ${hosts
        .map(host => `<Host Name="${host.name}" Version="${host.version}" />`)
        .join('\n      ')}
    </HostList>
    <LocaleList>
      <Locale Code="All"/>
    </LocaleList>
    <RequiredRuntimeList>
      <RequiredRuntime Name="CSXS" Version="${cepVersion}"/>
    </RequiredRuntimeList>
  </ExecutionEnvironment>
  <DispatchInfoList>
    <Extension Id="${bundleId}">
      <DispatchInfo>
        <Resources>
          <MainPath>./panel.html</MainPath>
          <CEFCommandLine>
            ${commandLineParams.join('\n            ')}
          </CEFCommandLine>
        </Resources>
        <Lifecycle>
          <AutoVisible>true</AutoVisible>
        </Lifecycle>
        <UI>
          <Type>Panel</Type>
          <Menu>${bundleName}</Menu>
          <Geometry>${size}${minSize}${maxSize}
          </Geometry>
          <Icons>
            ${icons}
          </Icons>
        </UI>
      </DispatchInfo>
    </Extension>
  </DispatchInfoList>
</ExtensionManifest>`
}
