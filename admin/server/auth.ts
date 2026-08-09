import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Request, RequestHandler, Response } from 'express';
import { parseCookie, stringifySetCookie } from 'cookie';
import { argon2Verify } from 'hash-wasm';
import type { AdminConfig } from './config.js';
import { AppError } from './errors.js';

const SESSION_COOKIE = 'mjm_blog_admin';
const SESSION_LIFETIME_SECONDS = 60 * 60 * 24 * 7;

export interface AdminSession {
  sub: string;
  csrf: string;
  iat: number;
  exp: number;
}

function signature(value: string, secret: string) {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

function safelyEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function encodeSession(session: AdminSession, secret: string) {
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  return `${payload}.${signature(payload, secret)}`;
}

function decodeSession(value: string, config: AdminConfig): AdminSession | null {
  const [payload, candidateSignature, extra] = value.split('.');
  if (!payload || !candidateSignature || extra) return null;
  if (!safelyEqual(candidateSignature, signature(payload, config.sessionSecret))) return null;

  try {
    const data = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as Partial<AdminSession>;
    if (
      data.sub !== config.adminUsername ||
      typeof data.csrf !== 'string' ||
      typeof data.iat !== 'number' ||
      typeof data.exp !== 'number' ||
      data.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return data as AdminSession;
  } catch {
    return null;
  }
}

function sessionCookieOptions(config: AdminConfig) {
  return {
    httpOnly: true,
    secure: config.environment === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: SESSION_LIFETIME_SECONDS,
  };
}

export async function authenticate(username: string, password: string, config: AdminConfig) {
  const valid = await argon2Verify({ hash: config.adminPasswordHash, password });
  if (!valid || username !== config.adminUsername) return null;

  const now = Math.floor(Date.now() / 1000);
  return {
    sub: username,
    csrf: randomBytes(24).toString('base64url'),
    iat: now,
    exp: now + SESSION_LIFETIME_SECONDS,
  } satisfies AdminSession;
}

export function setSessionCookie(response: Response, session: AdminSession, config: AdminConfig) {
  response.setHeader(
    'Set-Cookie',
    stringifySetCookie({
      name: SESSION_COOKIE,
      value: encodeSession(session, config.sessionSecret),
      ...sessionCookieOptions(config),
    }),
  );
}

export function clearSessionCookie(response: Response, config: AdminConfig) {
  response.setHeader(
    'Set-Cookie',
    stringifySetCookie({
      name: SESSION_COOKIE,
      value: '',
      ...sessionCookieOptions(config),
      maxAge: 0,
    }),
  );
}

export function readSession(request: Request, config: AdminConfig) {
  const cookies = parseCookie(request.headers.cookie ?? '');
  const value = cookies[SESSION_COOKIE];
  return value ? decodeSession(value, config) : null;
}

export function requireSession(config: AdminConfig): RequestHandler {
  return (request, response, next) => {
    const session = readSession(request, config);
    if (!session) return next(new AppError('登录已过期，请重新登录', 401, 'UNAUTHORIZED'));
    response.locals.session = session;
    next();
  };
}

function requestOrigin(request: Request) {
  const protocol = request.get('x-forwarded-proto')?.split(',')[0]?.trim() || request.protocol;
  const host = request.get('x-forwarded-host')?.split(',')[0]?.trim() || request.get('host');
  return host ? `${protocol}://${host}` : null;
}

export function requireSameOrigin(config: AdminConfig): RequestHandler {
  return (request, _response, next) => {
    if (config.environment !== 'production') return next();

    const supplied = request.get('origin');
    const expected = config.adminOrigin ?? requestOrigin(request);
    if (!supplied || !expected) {
      return next(new AppError('无法确认请求来源', 403, 'INVALID_ORIGIN'));
    }

    try {
      if (new URL(supplied).origin !== new URL(expected).origin) {
        return next(new AppError('请求来源不受信任', 403, 'INVALID_ORIGIN'));
      }
    } catch {
      return next(new AppError('请求来源无效', 403, 'INVALID_ORIGIN'));
    }
    next();
  };
}

export function requireCsrf(): RequestHandler {
  return (request, response, next) => {
    const session = response.locals.session as AdminSession | undefined;
    const csrf = request.get('x-csrf-token');
    if (!session || !csrf || !safelyEqual(csrf, session.csrf)) {
      return next(new AppError('页面凭证已失效，请刷新后重试', 403, 'INVALID_CSRF'));
    }
    next();
  };
}
