import { ConfigPlugin, withAppDelegate } from '@expo/config-plugins'

import { PluginConfigType } from '../pluginConfig'

function applyImplementation(appDelegate: string, find: string, add: string, replace?: boolean) {
  // Make sure the project does not have the settings already
  if (!appDelegate.includes(add)) {
    if (!appDelegate.includes(find))
      throw new Error(
        `Failed to apply iOS implementation - '${add}' - Unable to locate '${find}' in Expo Codepush Custom Plugin`
      )
    if (replace) return appDelegate.replace(find, add)
    else return appDelegate.replace(find, `${find}\n${add}`)
  }

  return appDelegate
}

export const withIosAppDelegateObjectiveCDependency: ConfigPlugin<PluginConfigType> = (config, props) => {
  return withAppDelegate(config, config => {
    const isSwift = !config.modResults.contents.includes('#import "AppDelegate.h"')

    if (isSwift) return config

    config.modResults.contents = applyImplementation(
      config.modResults.contents,
      `#import "AppDelegate.h"`,
      `#import <CodePush/CodePush.h>`
    )
    config.modResults.contents = applyImplementation(
      config.modResults.contents,
      `return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];`,
      `return [CodePush bundleURL];`,
      true
    )
    return config
  })
}

export const withIosAppDelegateSwiftDependency: ConfigPlugin<PluginConfigType> = (config, props) => {
  return withAppDelegate(config, config => {
    const isSwift = !config.modResults.contents.includes('#import "AppDelegate.h"')

    if (!isSwift) return config

    config.modResults.contents = applyImplementation(
      config.modResults.contents,
      `import ReactAppDependencyProvider`,
      `import CodePush`
    )
    config.modResults.contents = applyImplementation(
      config.modResults.contents,
      `return Bundle.main.url(forResource: "main", withExtension: "jsbundle")`,
      `return CodePush.bundleURL()`,
      true
    )
    return config
  })
}