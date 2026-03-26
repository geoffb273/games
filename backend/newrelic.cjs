'use strict';

const hasLicenseKey = Boolean(process.env.NEW_RELIC_LICENSE_KEY);

exports.config = {
  app_name: [process.env.NEW_RELIC_APP_NAME || 'game-brain-backend'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  agent_enabled: hasLicenseKey,
  distributed_tracing: {
    enabled: true,
  },
  logging: {
    filepath: 'stdout',
  },
  allow_all_headers: true,
  attributes: {
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.x*',
      'response.headers.setCookie*',
    ],
  },
};
