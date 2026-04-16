export const AD_MOB_AD_ID = process.env.EXPO_PUBLIC_AD_MOB_AD_ID!;

if (!AD_MOB_AD_ID) {
  throw new Error('Google Mobile Ads AD_ID is not set');
}

export const NEW_RELIC_APP_TOKEN = 'AA4777e80f92b85bb2028234beb9d7131e1da2e1e9-NRMA';

export const NEW_RELIC_CONFIG = {
  crashReportingEnabled: true,
  analyticsEventEnabled: true,
};
