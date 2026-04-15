import { createPublicKey, createVerify } from 'crypto';
import { type Logger } from 'pino';

import { AdMobSsvVerificationError } from '@/schema/errors';

import { fetchAdMobKeys } from './fetchKeys';

const SIGNATURE_NAME = 'signature';
const KEY_ID_NAME = 'key_id';

type QueryPart = {
  raw: string;
  key: string;
  value: string;
};

function parseRawQueryParam(raw: string): QueryPart {
  const separator = raw.indexOf('=');
  if (separator === -1) {
    return { raw, key: raw, value: '' };
  }
  return {
    raw,
    key: raw.slice(0, separator),
    value: raw.slice(separator + 1),
  };
}

/** Pulls `signature` and `key_id` from an SSV query and the UTF-8 substring that was signed (before `signature=`). */
function parseSignatureAndKeyId(queryString: string): {
  contentToVerify: string;
  signatureFromQuery: string;
  keyId: number;
} {
  const queryParts = queryString.split('&').map(parseRawQueryParam);
  const signaturePartIndex = queryParts.findIndex((queryPart) => queryPart.key === SIGNATURE_NAME);
  if (signaturePartIndex === -1) {
    throw new AdMobSsvVerificationError('Missing signature parameter');
  }

  const signaturePart = queryParts[signaturePartIndex];
  const signatureFromQuery = signaturePart.value;
  if (signatureFromQuery.length === 0) {
    throw new AdMobSsvVerificationError('Missing signature parameter');
  }

  const keyIdPart = queryParts.find((queryPart) => queryPart.key === KEY_ID_NAME);
  if (keyIdPart == null) {
    throw new AdMobSsvVerificationError('Missing key_id parameter');
  }

  const keyIdStr = keyIdPart.value;
  const keyId = Number(keyIdStr);
  if (!Number.isFinite(keyId)) {
    throw new AdMobSsvVerificationError('Invalid key_id');
  }

  const contentToVerify =
    signaturePartIndex === 0
      ? ''
      : queryParts
          .slice(0, signaturePartIndex)
          .map(({ raw }) => raw)
          .join('&');

  return { contentToVerify, signatureFromQuery, keyId };
}

/** Decodes the `signature` query value (URL decode + base64url) into the DER signature bytes Node `verify` expects. */
function decodeSignatureToBuffer(signatureFromQuery: string): Buffer {
  let s: string;
  try {
    s = decodeURIComponent(signatureFromQuery);
  } catch {
    throw new AdMobSsvVerificationError('Invalid signature encoding');
  }
  const normalized = s.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
  try {
    return Buffer.from(normalized + padding, 'base64');
  } catch {
    throw new AdMobSsvVerificationError('Invalid signature base64');
  }
}

/**
 * Verifies an AdMob rewarded-ad SSV callback query string (no leading `?`), using Google's keys and ECDSA P-256 / SHA-256.
 * @param rawQuery - Query or path-style string containing `signature=` and `key_id=`
 */
export async function verifyAdMobSsvQueryString({
  rawQuery,
  logger,
}: {
  rawQuery: string;
  logger: Logger;
}): Promise<void> {
  if (!rawQuery || rawQuery.trim() === '') {
    throw new AdMobSsvVerificationError('Empty query string');
  }

  const { contentToVerify, signatureFromQuery, keyId } = parseSignatureAndKeyId(rawQuery);

  const keys = await fetchAdMobKeys({ logger });
  const publicKeyDer = keys[keyId];
  if (publicKeyDer == null) {
    throw new AdMobSsvVerificationError(`Unknown key_id: ${keyId}`);
  }

  const publicKey = createPublicKey({
    key: publicKeyDer,
    format: 'der',
    type: 'spki',
  });

  const signatureBuffer = decodeSignatureToBuffer(signatureFromQuery);

  const verify = createVerify('SHA256');
  verify.update(contentToVerify, 'utf8');
  verify.end();

  const ok = verify.verify(publicKey, signatureBuffer);
  if (!ok) {
    throw new AdMobSsvVerificationError('Invalid signature');
  }
}
