const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const sharedDir = path.resolve(__dirname, '../shared');
const config = mergeConfig(getDefaultConfig(__dirname), {
  watchFolders: [sharedDir],
  resolver: {
    nodeModulesPaths: [path.resolve(__dirname, 'node_modules')],
  },
});

module.exports = withNativeWind(config, { input: './src/global.css' });
