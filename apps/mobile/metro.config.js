// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add local node_modules to resolution
const localNodeModules = path.resolve(__dirname, 'node_modules');
const rootNodeModules = path.resolve(__dirname, '../../node_modules');

config.watchFolders = [__dirname, localNodeModules];

// Ensure local node_modules takes priority
config.resolver.nodeModulesPaths = [localNodeModules, rootNodeModules];

module.exports = config;