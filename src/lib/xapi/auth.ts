import { createHmac, randomUUID, timingSafeEqual } from "crypto";

export type XapiTokenPayload = {
  iss: "gtops-dashboard";
  aud: "coursera-xapi";
  scope: "xapi:write";
  iat: number;
  exp: number;
  jti: string;
};

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payloadBase64: string, signingSecret: string) {
  return createHmac("sha256", signingSecret)
    .update(payloadBase64)
    .digest("base64url");
}

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return timingSafeEqual(aBuffer, bBuffer);
}

export function getXapiConfig() {
  return {
    clientId: requiredEnv("XAPI_CLIENT_ID"),
    clientSecret: requiredEnv("XAPI_CLIENT_SECRET"),
    signingSecret: requiredEnv("XAPI_TOKEN_SIGNING_SECRET"),
    tokenTtlSeconds: Number(process.env.XAPI_TOKEN_TTL_SECONDS ?? 3600),
  };
}

export function validateXapiClient(clientId: string, clientSecret: string) {
  const config = getXapiConfig();

  return (
    safeEqual(clientId, config.clientId) &&
    safeEqual(clientSecret, config.clientSecret)
  );
}

export function createXapiAccessToken() {
  const config = getXapiConfig();
  const now = Math.floor(Date.now() / 1000);
  const payload: XapiTokenPayload = {
    iss: "gtops-dashboard",
    aud: "coursera-xapi",
    scope: "xapi:write",
    iat: now,
    exp: now + config.tokenTtlSeconds,
    jti: randomUUID(),
  };
  const payloadBase64 = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(payloadBase64, config.signingSecret);

  return {
    accessToken: `${payloadBase64}.${signature}`,
    expiresIn: config.tokenTtlSeconds,
  };
}

export function validateXapiAccessToken(accessToken: string) {
  const config = getXapiConfig();
  const [payloadBase64, signature] = accessToken.split(".");

  if (!payloadBase64 || !signature) {
    return { valid: false, reason: "Malformed bearer token." };
  }

  const expectedSignature = signPayload(payloadBase64, config.signingSecret);

  if (!safeEqual(signature, expectedSignature)) {
    return { valid: false, reason: "Invalid bearer token signature." };
  }

  let payload: XapiTokenPayload;

  try {
    payload = JSON.parse(base64UrlDecode(payloadBase64)) as XapiTokenPayload;
  } catch {
    return { valid: false, reason: "Invalid bearer token payload." };
  }

  const now = Math.floor(Date.now() / 1000);

  if (payload.exp <= now) {
    return { valid: false, reason: "Bearer token expired." };
  }

  if (payload.scope !== "xapi:write") {
    return { valid: false, reason: "Bearer token missing xapi:write scope." };
  }

  return { valid: true, payload };
}
