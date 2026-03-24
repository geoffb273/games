import { TestIds } from 'react-native-google-mobile-ads';

export const AD_MOB_AD_ID = __DEV__
  ? TestIds.REWARDED
  : process.env.EXPO_PUBLIC_GOOGLE_MOBILE_ADS_AD_ID!;

if (!AD_MOB_AD_ID) {
  throw new Error('Google Mobile Ads AD_ID is not set');
}
