import NewRelic from 'newrelic-react-native-agent';

import { NEW_RELIC_APP_TOKEN, NEW_RELIC_CONFIG } from '@/constants/config';
import { type EVENT } from '@/constants/event';

NewRelic.startAgent(NEW_RELIC_APP_TOKEN, NEW_RELIC_CONFIG);

type NewRelicAttributes = { event: EVENT } & Record<string, string | number | boolean>;

/**
 * Log an info message with attributes.
 * @param attributes - The attributes to log.
 * @param message - The message to log.
 */
export function logInfo(attributes: NewRelicAttributes, message: string) {
  NewRelic.logAttributes({ ...attributes, message, level: 'INFO' });
}

/**
 * Log an error message with attributes.
 * @param attributes - The attributes to log.
 * @param message - The message to log.
 */
export function logError(attributes: NewRelicAttributes, message: string) {
  NewRelic.logAttributes({ ...attributes, message, level: 'ERROR' });
}
