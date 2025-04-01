const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.watchFolders = [__dirname].filter(
  (folder) => !folder.includes("node_modules"),
);

module.exports = withNativeWind(config, { input: "./global.css" });
