const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const sharedDir = path.resolve(__dirname, "../shared");
const config = getDefaultConfig(__dirname);

config.watchFolders = [...(config.watchFolders || []), sharedDir];
config.resolver.nodeModulesPaths = [path.resolve(__dirname, "node_modules")];

module.exports = withNativeWind(config, { input: "./src/global.css" });
