import { ConfigPlugin, withAppBuildGradle } from '@expo/config-plugins'

import { addStringAndValidate } from '../helpers'
import { PluginConfigType } from '../pluginConfig'

/**
 * Update `<project>/build.gradle` by adding the codepush.gradle file
 * as an additional build task definition underneath react.gradle
 */

function applyImplementation(appBuildGradle: string) {
  const codePushImplementation = `apply from: new File(["node", "--print", "require.resolve('@turbopush/react-native-code-push/package.json')"].execute(null, rootDir).text.trim()).getParentFile().getAbsolutePath() + "/android/codepush.gradle"`

  return addStringAndValidate(appBuildGradle, {
    add: codePushImplementation,
    tag: 'withAndroidBuildscriptDependency',
    position: 'END_OF_FILE'
  })
}

export const withAndroidBuildscriptDependency: ConfigPlugin<PluginConfigType> = config => {
  return withAppBuildGradle(config, config => {
    config.modResults.contents = applyImplementation(config.modResults.contents)
    return config
  })
}
