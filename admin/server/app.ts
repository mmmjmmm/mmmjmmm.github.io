import { existsSync } from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { z, ZodError } from 'zod';
import { articleInputSchema } from '../shared/article.js';
import {
  authenticate,
  clearSessionCookie,
  readSession,
  requireCsrf,
  requireSameOrigin,
  requireSession,
  setSessionCookie,
} from './auth.js';
import type { AdminConfig } from './config.js';
import { AppError, errorMessage } from './errors.js';
import { PublishingService } from './publishing.js';

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1).max(500),
});

const articleActionSchema = z.object({
  article: articleInputSchema,
  draftSha: z.string().min(1).nullable(),
  publishedSha: z.string().min(1).nullable(),
});

function asyncRoute(
  handler: (request: Request, response: Response, next: NextFunction) => Promise<unknown>,
) {
  return (request: Request, response: Response, next: NextFunction) => {
    void handler(request, response, next).catch(next);
  };
}

function routeSlug(request: Request) {
  return String(request.params.slug ?? '');
}

export function createApp(config: AdminConfig) {
  const app = express();
  const publishing = new PublishingService(config);
  const sameOrigin = requireSameOrigin(config);
  const authenticated = requireSession(config);
  const csrf = requireCsrf();
  const loginJson = express.json({ limit: '16kb' });
  const articleJson = express.json({ limit: '4mb' });

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use('/api', (_request, response, next) => {
    response.setHeader('Cache-Control', 'no-store');
    next();
  });

  app.get('/api/health', (_request, response) => {
    response.json({ ok: true });
  });

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 8,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: { code: 'TOO_MANY_ATTEMPTS', message: '尝试次数过多，请稍后再试' } },
  });

  app.post(
    '/api/auth/login',
    sameOrigin,
    loginLimiter,
    loginJson,
    asyncRoute(async (request, response) => {
      const credentials = loginSchema.parse(request.body);
      const session = await authenticate(credentials.username, credentials.password, config);
      if (!session) throw new AppError('用户名或密码不正确', 401, 'INVALID_CREDENTIALS');
      setSessionCookie(response, session, config);
      response.json({ username: session.sub, csrfToken: session.csrf });
    }),
  );

  app.get('/api/session', (request, response, next) => {
    const session = readSession(request, config);
    if (!session) return next(new AppError('尚未登录', 401, 'UNAUTHORIZED'));
    response.json({ username: session.sub, csrfToken: session.csrf });
  });

  app.post('/api/auth/logout', sameOrigin, authenticated, csrf, (_request, response) => {
    clearSessionCookie(response, config);
    response.status(204).end();
  });

  app.get(
    '/api/posts',
    authenticated,
    asyncRoute(async (_request, response) => {
      response.json({ articles: await publishing.listArticles() });
    }),
  );

  app.get(
    '/api/posts/:slug',
    authenticated,
    asyncRoute(async (request, response) => {
      response.json(await publishing.getArticle(routeSlug(request)));
    }),
  );

  app.put(
    '/api/posts/:slug/draft',
    sameOrigin,
    authenticated,
    csrf,
    articleJson,
    asyncRoute(async (request, response) => {
      const payload = articleActionSchema.parse(request.body);
      const result = await publishing.saveDraft(routeSlug(request), payload.article, payload);
      response.json(result);
    }),
  );

  app.post(
    '/api/posts/:slug/publish',
    sameOrigin,
    authenticated,
    csrf,
    articleJson,
    asyncRoute(async (request, response) => {
      const payload = articleActionSchema.parse(request.body);
      response.json(await publishing.publish(routeSlug(request), payload.article, payload));
    }),
  );

  app.post(
    '/api/posts/:slug/unpublish',
    sameOrigin,
    authenticated,
    csrf,
    articleJson,
    asyncRoute(async (request, response) => {
      const payload = articleActionSchema.parse(request.body);
      response.json(await publishing.unpublish(routeSlug(request), payload.article, payload));
    }),
  );

  app.get(
    '/api/deployments/:sha',
    authenticated,
    asyncRoute(async (request, response) => {
      response.json(await publishing.deployment(String(request.params.sha ?? '')));
    }),
  );

  app.use('/api', (_request, _response, next) => {
    next(new AppError('接口不存在', 404, 'NOT_FOUND'));
  });

  const clientRoot = path.resolve(process.cwd(), 'dist/client');
  if (existsSync(clientRoot)) {
    app.use(
      express.static(clientRoot, {
        index: false,
        setHeaders(response, filePath) {
          if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        },
      }),
    );
    app.use((_request, response) => {
      response.setHeader('Cache-Control', 'no-cache');
      response.sendFile(path.join(clientRoot, 'index.html'), { dotfiles: 'allow' });
    });
  }

  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    const bodyError = error as { status?: number; type?: string };
    if (bodyError?.status === 413) {
      response.status(413).json({
        error: { code: 'PAYLOAD_TOO_LARGE', message: '提交的内容太大' },
      });
      return;
    }
    if (error instanceof SyntaxError && bodyError?.status === 400) {
      response.status(400).json({
        error: { code: 'INVALID_JSON', message: '请求内容格式无效' },
      });
      return;
    }
    if (error instanceof ZodError) {
      response.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: '文章内容不完整，请检查标红的字段',
          details: error.flatten(),
        },
      });
      return;
    }
    const appError = error instanceof AppError ? error : new AppError(errorMessage(error));
    if (config.environment !== 'production' && !(error instanceof AppError)) {
      console.error(error);
    }
    response.status(appError.status).json({
      error: {
        code: appError.code,
        message: appError.message,
        ...(appError.details === undefined ? {} : { details: appError.details }),
      },
    });
  });

  return app;
}
