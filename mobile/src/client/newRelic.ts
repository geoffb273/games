import NewRelic from 'newrelic-react-native-agent';

import { NEW_RELIC_APP_TOKEN, NEW_RELIC_CONFIG } from '@/constants/config';
import { type EVENT } from '@/constants/event';

NewRelic.startAgent(NEW_RELIC_APP_TOKEN, NEW_RELIC_CONFIG);

type NewRelicAttributes = { event: EVENT } & Record<string, string | number | boolean>;
const MOBILE_LOG_EVENT_TYPE = 'MobileLog';

function toAttributeMap(attributes: Record<string, string | number | boolean>) {
  return new Map<string, string | number | boolean>(Object.entries(attributes));
}

/**
 * Log an info message with attributes.
 * @param attributes - The attributes to log.
 * @param message - The message to log.
 */
export function logInfo(attributes: NewRelicAttributes, message: string) {
  const payload = { ...attributes, message, level: 'INFO' as const };
  NewRelic.recordCustomEvent(MOBILE_LOG_EVENT_TYPE, attributes.event, toAttributeMap(payload));
}

/**
 * Log an error message with attributes.
 * @param attributes - The attributes to log.
 * @param message - The message to log.
 */
export function logError(attributes: NewRelicAttributes, message: string) {
  const payload = { ...attributes, message, level: 'ERROR' as const };
  NewRelic.recordCustomEvent(MOBILE_LOG_EVENT_TYPE, attributes.event, toAttributeMap(payload));
}
