import crypto from 'crypto';

export const SESSION_COOKIE = 'internal_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  const secret = process.env.INTERNAL_SESSION_SECRET;
  if (!secret) {
    throw new Error('INTERNAL_SESSION_SECRET is not set');
  }
  return secret;
}

function sign(expiresAtMs) {
  return crypto
    .createHmac('sha256', getSecret())
    .update(String(expiresAtMs))
    .digest('hex');
}

export function createSessionToken() {
  const expiresAtMs = Date.now() + SESSION_TTL_MS;
  return `${expiresAtMs}.${sign(expiresAtMs)}`;
}

export function verifySessionToken(token) {
  if (!token) return false;
  const [expiresAtMsStr, signature] = token.split('.');
  if (!expiresAtMsStr || !signature) return false;

  const expiresAtMs = Number(expiresAtMsStr);
  if (!Number.isFinite(expiresAtMs) || expiresAtMs < Date.now()) return false;

  const expected = sign(expiresAtMs);
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signature);
  if (expectedBuf.length !== actualBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

export function isAuthorized(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

export function checkPassword(candidate) {
  const expected = process.env.INTERNAL_DASHBOARD_PASSWORD;
  if (!expected || typeof candidate !== 'string') return false;

  const expectedBuf = Buffer.from(expected);
  const candidateBuf = Buffer.from(candidate);
  if (expectedBuf.length !== candidateBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, candidateBuf);
}
