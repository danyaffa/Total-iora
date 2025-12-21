import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.danyaffa.totaliora',
  appName: 'Total-iora',
  webDir: 'out',                 // REQUIRED for Next.js export
  bundledWebRuntime: false,

  server: {
    androidScheme: 'https',
    cleartext: true
  },

  android: {
    allowMixedContent: true
  }
};

export default config;
