import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.learnypie.app',
  appName: 'Language Progress',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
