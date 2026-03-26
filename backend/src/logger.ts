import pino from 'pino';

/**
 * Logger is a pino instance that is used to log messages to the console.
 *
 * Logs through this logger should automatically be sent to New Relic
 *
 * @deprecated Prefer the logger from the context instead.
 */
export const logger = pino();
