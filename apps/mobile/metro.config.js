// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix for yarn workspaces - disable hashing for symlinked files
config.watchFolders = [__dirname];
config.resolver.extraNodeModules = {};

module.exports = config;