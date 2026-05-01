import { type ExpoConfig } from 'expo/config';

export default (): ExpoConfig => ({
  name: 'Game Brain',
  slug: 'game-brain',
  version: '1.1.5',
  orientation: 'portrait',
  scheme: 'games-brain',
  userInterfaceStyle: 'automatic',
  ios: {
    icon: './assets/icon.png',
    bundleIdentifier: 'com.grbrandt.gamebrain',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#208AEF',
      },
    ],
    'expo-secure-store',
    'expo-font',
    'expo-sharing',
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
        },
      },
    ],
    [
      'react-native-google-mobile-ads',
      {
        iosAppId: process.env.GOOGLE_MOBILE_ADS_IOS_APP_ID,
        delayAppMeasurementInit: true,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: 'cd02e05a-c64a-4edf-aee5-ed208d669243',
    },
  },
});
