import { z } from 'zod';

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8787),
  FC_CUSTOM_LISTEN_PORT: z.coerce.number().int().positive().optional(),
  ADMIN_USERNAME: z.string().min(3),
  ADMIN_PASSWORD_HASH: z.string().min(20),
  SESSION_SECRET: z.string().min(32),
  GITHUB_TOKEN: z.string().min(20),
  GITHUB_OWNER: z.string().min(1),
  GITHUB_REPO: z.string().min(1),
  GITHUB_MAIN_BRANCH: z.string().default('main'),
  GITHUB_DRAFT_BRANCH: z.string().default('drafts'),
  PUBLIC_SITE_URL: z.string().url(),
  ADMIN_ORIGIN: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().url().optional(),
  ),
});

export type AdminConfig = ReturnType<typeof loadConfig>;

export function loadConfig(environment: NodeJS.ProcessEnv = process.env) {
  const parsed = configSchema.safeParse(environment);
  if (!parsed.success) {
    const names = parsed.error.issues.map(({ path }) => path.join('.')).join(', ');
    throw new Error(`后台配置缺失或无效: ${names}`);
  }

  const values = parsed.data;
  return {
    environment: values.NODE_ENV,
    port: values.FC_CUSTOM_LISTEN_PORT ?? values.PORT,
    adminUsername: values.ADMIN_USERNAME,
    adminPasswordHash: values.ADMIN_PASSWORD_HASH,
    sessionSecret: values.SESSION_SECRET,
    githubToken: values.GITHUB_TOKEN,
    githubOwner: values.GITHUB_OWNER,
    githubRepo: values.GITHUB_REPO,
    githubMainBranch: values.GITHUB_MAIN_BRANCH,
    githubDraftBranch: values.GITHUB_DRAFT_BRANCH,
    publicSiteUrl: values.PUBLIC_SITE_URL.replace(/\/$/u, ''),
    adminOrigin: values.ADMIN_ORIGIN?.replace(/\/$/u, ''),
  } as const;
}
