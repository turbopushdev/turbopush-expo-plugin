import { ConfigPlugin, withMainApplication } from "@expo/config-plugins";

import { addStringAndValidate } from "../helpers";
import { PluginConfigType } from "../pluginConfig";

/**
 * Update `<project>/build.gradle` by adding the codepush.gradle file
 * as an additional build task definition underneath react.gradle
 */

const isNewTemplate = (contents: string): boolean =>
  contents.includes("ExpoReactHostFactory");

export const withAndroidMainApplicationDependency: ConfigPlugin<
  PluginConfigType
> = (config) => {
  return withMainApplication(config, (config) => {
    const contents = config.modResults.contents;

    if (isNewTemplate(contents)) {
      // SDK 55+ (RN 0.83+): ExpoReactHostFactory-based template
      config.modResults.contents = addStringAndValidate(
        config.modResults.contents,
        {
          find: "import expo.modules.ExpoReactHostFactory",
          add: `import com.microsoft.codepush.react.CodePush`,
          tag: "withAndroidMainApplicationDependency",
        },
      );

      config.modResults.contents = addStringAndValidate(
        config.modResults.contents,
        {
          find: "      context = applicationContext,",
          add: `      jsBundleFilePath = CodePush.getJSBundleFile(),`,
          position: "BEFORE",
          tag: "withAndroidMainApplicationDependency",
        },
      );
    } else {
      // SDK 53 and below: ReactNativeHostWrapper-based template
      config.modResults.contents = addStringAndValidate(
        config.modResults.contents,
        {
          find: "import expo.modules.ReactNativeHostWrapper",
          add: `import com.microsoft.codepush.react.CodePush`,
          tag: "withAndroidMainApplicationDependency",
        },
      );

      config.modResults.contents = addStringAndValidate(
        config.modResults.contents,
        {
          find: "object : DefaultReactNativeHost(this) {",
          add: `override fun getJSBundleFile(): String {
          return CodePush.getJSBundleFile()
        }`,
          tag: "withAndroidMainApplicationDependency",
        },
      );
    }

    config.modResults.contents = addStringAndValidate(
      config.modResults.contents,
      {
        find: "    super.onCreate()",
        add: `    CodePush.getInstance(getString(R.string.CodePushDeploymentKey), this, BuildConfig.DEBUG)`,
        tag: "withAndroidMainApplicationDependency",
      },
    );

    return config;
  });
};
