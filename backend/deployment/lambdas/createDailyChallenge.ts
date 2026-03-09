/// <reference types="node" />
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

const ssm = new SSMClient({});

function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function dateTwoDaysFromNow(): Date {
  const now = new Date();
  const inTwoDays = new Date(now);
  inTwoDays.setUTCDate(inTwoDays.getUTCDate() + 2);
  return startOfDayUTC(inTwoDays);
}

export async function handler(): Promise<{ statusCode: number; body: string }> {
  const graphqlUrl = process.env.BACKEND_GRAPHQL_URL;
  const adminSecretParamName = process.env.ADMIN_SECRET_PARAM;
  if (!graphqlUrl || !adminSecretParamName) {
    const missing = [
      !graphqlUrl && 'BACKEND_GRAPHQL_URL',
      !adminSecretParamName && 'ADMIN_SECRET_PARAM',
    ]
      .filter(Boolean)
      .join(', ');
    throw new Error(`Missing env: ${missing}`);
  }

  const { Parameter } = await ssm.send(
    new GetParameterCommand({ Name: adminSecretParamName, WithDecryption: true }),
  );
  const adminSecret = Parameter?.Value;
  if (!adminSecret) {
    throw new Error('Could not read ADMIN_SECRET from SSM');
  }

  const date = dateTwoDaysFromNow();
  const dateIso = date.toISOString().split('T')[0];

  const mutation = `
    mutation CreateDailyChallenge($input: MutationCreateDailyChallengeInput!) {
      createDailyChallenge(input: $input) {
        ... on MutationCreateDailyChallengeSuccess {
          data { id date }
        }
        ... on AlreadyExistsError {
          message
        }
        ... on UnauthorizedError {
          message
        }
      }
    }
  `;

  const res = await fetch(graphqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': adminSecret,
    },
    body: JSON.stringify({
      query: mutation,
      variables: { input: { date: dateIso } },
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`GraphQL request failed ${res.status}: ${text}`);
  }

  let json: {
    data?: {
      createDailyChallenge?: {
        data?: { id: string };
        message?: string;
      };
    };
    errors?: Array<{ message: string }>;
  };
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON response: ${text.slice(0, 200)}`);
  }

  if (json.errors?.length) {
    const msg = json.errors.map((e) => e.message).join('; ');
    throw new Error(`GraphQL errors: ${msg}`);
  }

  const result = json.data?.createDailyChallenge;
  if (result?.data) {
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, id: result.data.id }),
    };
  }
  // AlreadyExistsError (or other union member with message) - treat as success for idempotency
  if (
    result?.message &&
    (result.message.includes('already exists') || result.message.includes('AlreadyExists'))
  ) {
    return { statusCode: 200, body: JSON.stringify({ ok: true, alreadyExists: true }) };
  }
  if (result?.message) {
    throw new Error(`Mutation returned error: ${result.message}`);
  }
  throw new Error(`Unexpected response: ${text.slice(0, 300)}`);
}
