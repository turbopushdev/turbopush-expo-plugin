import { ConfigPlugin, withMainApplication } from '@expo/config-plugins'

import { addStringAndValidate } from '../helpers'
import { PluginConfigType } from '../pluginConfig'

/**
 * Update `<project>/build.gradle` by adding the codepush.gradle file
 * as an additional build task definition underneath react.gradle
 */

export const withAndroidMainApplicationDependency: ConfigPlugin<PluginConfigType> = config => {
  return withMainApplication(config, config => {
    config.modResults.contents = addStringAndValidate(config.modResults.contents, {
      find: 'import expo.modules.ReactNativeHostWrapper',
      add: `import com.microsoft.codepush.react.CodePush`,
      tag: 'withAndroidMainApplicationDependency'
    })

    config.modResults.contents = addStringAndValidate(config.modResults.contents, {
      find: 'object : DefaultReactNativeHost(this) {',
      add: `override fun getJSBundleFile(): String {
          return CodePush.getJSBundleFile()
        }`,
      tag: 'withAndroidMainApplicationDependency'
    })

    return config
  })
}
