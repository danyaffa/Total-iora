// FILE: /capacitor.config.ts
// Keep this file in the repo for local Capacitor builds,
// but do NOT import @capacitor/cli so Vercel/Next build doesn't fail.

const config = {
  appId: "com.danyaffa.totaliora",
  appName: "Total-iora",
  webDir: "out",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https",
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
