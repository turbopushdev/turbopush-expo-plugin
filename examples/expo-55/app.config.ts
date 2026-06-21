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
  assetBundlePatterns: ["**/*"],
  experiments: {
    tsconfigPaths: true,
    typedRoutes: true,
    reactCompiler: true,
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
    [
      "expo-build-properties",
      {
        ios: {
          deploymentTarget: "15.5",
          hermes: true,
          privacyManifestAggregationEnabled: true,
          useFrameworks: "static",
        },
      },
    ],
    [
      "../../app.plugin.js",
      {
        android: {
          CodePushDeploymentKey:
            process.env.EXPO_PUBLIC_CODE_PUSH_KEY_ANDROID ?? "FAKE_KEY",
        },
        ios: {
          CodePushDeploymentKey:
            process.env.EXPO_PUBLIC_CODE_PUSH_KEY_IOS ?? "FAKE_KEY",
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
