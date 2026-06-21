import { ExpoConfig } from "expo/config";

import { APP_VERSION } from "../shared/constants.json";

const config: ExpoConfig = {
  slug: "test-codepush",
  owner: "test-codepush",
  android: {
    package: "com.test.codepush",
    versionCode: 1,
    version: APP_VERSION,
  },
  newArchEnabled: true,
  assetBundlePatterns: ["**/*"],
  experiments: {
    tsconfigPaths: true,
    typedRoutes: true,
  },
  ios: {
    buildNumber: "1",
    supportsTablet: true,
    bundleIdentifier: "com.test.codepush",
    version: APP_VERSION,
  },
  updates: {
    enabled: false,
    fallbackToCacheTimeout: 0,
  },
  name: "Codepush plugin Demo",
  orientation: "portrait",
  plugins: [
    // temporary fix for fmt 11.0.2 consteval compilation error on Xcode 26.4+
    "../shared/plugins/ios/withFmtFix",
    [
      'expo-build-properties',
      {
        android: {
          buildToolsVersion: '34.0.0',
          compileSdkVersion: 35,
          targetSdkVersion: 34,
        },
        ios: {
          deploymentTarget: "15.5",
          hermes: true,
          privacyManifestAggregationEnabled: true,
          useFrameworks: 'static',
        },
      },
    ],
    [
      "../../app.plugin.js",
      {
        android: {
          CodePushDeploymentKey: process.env.EXPO_PUBLIC_CODE_PUSH_KEY_ANDROID ?? "FAKE_KEY",
        },
        ios: {
          CodePushDeploymentKey: process.env.EXPO_PUBLIC_CODE_PUSH_KEY_IOS ?? "FAKE_KEY",
        },
      },
    ],
    "expo-router",
  ],
  scheme: "com.test.codepush",
  userInterfaceStyle: "automatic",
  version: APP_VERSION,
};

export default config;
