const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Agregar extensiones adicionales
config.resolver.assetExts.push('css');

module.exports = config;