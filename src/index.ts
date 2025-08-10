import { ConfigPlugin, createRunOncePlugin } from '@expo/config-plugins'

import {
  withAndroidBuildscriptDependency,
  withAndroidMainApplicationDependency,
  withAndroidSettingsDependency,
  withAndroidStringsDependency
} from './android'
import { withIosAppDelegateObjectiveCDependency, withIosBuildscriptDependency, withIosAppDelegateSwiftDependency } from './ios'
import { PluginConfigType } from './pluginConfig'
import { Logger } from './Logger'

/**
 * A config plugin for configuring `react-native-code-push`
 */
const withRnCodepush: ConfigPlugin<PluginConfigType> = (config, props) => {
  if (!props.android.CodePushDeploymentKey) {
    Logger.warn('Android CodePushDeploymentKey is not set')
  }
  if (!props.ios.CodePushDeploymentKey) {
    Logger.warn('iOS CodePushDeploymentKey is not set')
  }

  config = withAndroidBuildscriptDependency(config, props)
  config = withAndroidSettingsDependency(config, props)
  config = withAndroidStringsDependency(config, props)
  config = withAndroidMainApplicationDependency(config, props)
  // plugins order matter: the later one would run first
  config = withIosBuildscriptDependency(config, props)
  config = withIosAppDelegateObjectiveCDependency(config, props)
  config = withIosAppDelegateSwiftDependency(config, props)

  return config
}

let pkg: { name: string; version?: string } = {
  name: 'react-native-code-push'
}
try {
  const codePushPkg = require('@turbopush/react-native-code-push/package.json')
  pkg = codePushPkg
} catch {}

export default createRunOncePlugin(withRnCodepush, pkg.name, pkg.version)
