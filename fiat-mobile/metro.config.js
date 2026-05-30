const { getDefaultConfig } = require("expo/metro-config");

let config = getDefaultConfig(__dirname);

try {
  // En NativeWind v4, el import correcto es 'nativewind/metro'
  const { withNativeWind } = require("nativewind/metro");
  config = withNativeWind(config, { input: "./global.css" });
} catch (e) {
  if (e.message && e.message.includes("Received protocol 'c:'")) {
    console.warn("⚠️ Aviso: Error de protocolo en Windows detectado. Continuando sin NativeWind para validación local.");
    console.warn("Nota: El build remoto en EAS no tendrá este problema.");
  } else {
    // Si es otro error (como que el módulo no existe), lo lanzamos
    console.error("Error cargando configuración de Metro:", e);
    throw e;
  }
}

module.exports = config;
