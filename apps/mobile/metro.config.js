// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix for yarn workspaces - include root node_modules
config.watchFolders = [__dirname, path.resolve(__dirname, '../../node_modules')];
config.resolver.extraNodeModules = {
  'expo-router': path.resolve(__dirname, '../../node_modules/expo-router'),
};

module.exports = config;