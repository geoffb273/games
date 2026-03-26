import { createPublicKey, createVerify } from 'crypto';

import { AdMobSsvVerificationError } from '@/schema/errors';

import { fetchAdMobKeys } from './fetchKeys';

const SIGNATURE_PARAM = 'signature=';
const KEY_ID_PARAM = 'key_id=';

/** Pulls `signature` and `key_id` from an SSV query and the UTF-8 substring that was signed (before `signature=`). */
function parseSignatureAndKeyId(queryString: string): {
  contentToVerify: string;
  signatureFromQuery: string;
  keyId: number;
} {
  const sigIdx = queryString.indexOf(SIGNATURE_PARAM);
  if (sigIdx === -1) {
    throw new AdMobSsvVerificationError('Missing signature parameter');
  }

  const contentToVerify = sigIdx === 0 ? '' : queryString.slice(0, sigIdx - 1);

  const afterSig = queryString.slice(sigIdx);
  const keyIdIdx = afterSig.indexOf(KEY_ID_PARAM);
  if (keyIdIdx === -1) {
    throw new AdMobSsvVerificationError('Missing key_id parameter');
  }

  const sigValueStart = SIGNATURE_PARAM.length;
  const signatureFromQuery = afterSig.slice(sigValueStart, keyIdIdx - 1);

  const afterKeyId = afterSig.slice(keyIdIdx + KEY_ID_PARAM.length);
  const amp = afterKeyId.indexOf('&');
  const keyIdStr = amp === -1 ? afterKeyId : afterKeyId.slice(0, amp);
  const keyId = Number(keyIdStr);
  if (!Number.isFinite(keyId)) {
    throw new AdMobSsvVerificationError('Invalid key_id');
  }

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
export async function verifyAdMobSsvQueryString(rawQuery: string): Promise<void> {
  if (!rawQuery || rawQuery.trim() === '') {
    throw new AdMobSsvVerificationError('Empty query string');
  }

  const { contentToVerify, signatureFromQuery, keyId } = parseSignatureAndKeyId(rawQuery);

  const keys = await fetchAdMobKeys();
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
