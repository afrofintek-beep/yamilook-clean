import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yamilook.app',
  appName: 'Yamilook',
  webDir: 'dist',
  server: {
    url: 'https://www.yamilook.com',
    cleartext: false,
  },
};

export default config;
