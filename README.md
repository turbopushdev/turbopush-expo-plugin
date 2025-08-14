# Turbopush Expo Plugin

This plugin is used to manage the Turbopush updates for your Expo app.

## Installation

```bash
yarn add @turbopush/turbopush-expo-plugin
```

## Setup

Follow the instructions in our [plugin documentation](https://docs.turbopush.org/setup/expo-setup).

## Usage

1. Open your Expo app config file (app.config.json or app.config.js instead of app.json).

2. Insert the following into the plugins section of your config (Don't duplicate configuration, if the '@turbopush/turbopush-expo-plugin' item already exists, simply add this portion.). Create the plugins section if it doesn't already exist. CodePushPublicKey is optional, see Code Signing setup for more information.

    ```javascript
    "plugins": [
      [
        '@turbopush/turbopush-expo-plugin',
        {
          android: {
            CodePushDeploymentKey: 'YOUR_ANDROID_CODE_PUSH_KEY',
          },
          ios: {
            CodePushDeploymentKey: 'YOUR_IOS_CODE_PUSH_KEY',
          },
        }
      ]
    ]
    ```
3. Replace `YOUR_ANDROID_CODE_PUSH_KEY` and `YOUR_IOS_CODE_PUSH_KEY` with the Deployment key.
4. Run `yarn prebuild` to regenerate your native code with the turbopush dependencies.