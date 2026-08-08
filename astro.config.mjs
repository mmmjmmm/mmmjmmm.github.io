import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

const [githubOwner, githubRepository] = (process.env.GITHUB_REPOSITORY ?? '').split('/');
const isGitHubPagesBuild = process.env.DEPLOY_TARGET === 'github-pages';
const inferredGitHubSite = githubOwner ? `https://${githubOwner}.github.io` : undefined;
const inferredGitHubBase =
  githubOwner && githubRepository && githubRepository !== `${githubOwner}.github.io`
    ? `/${githubRepository}`
    : '/';

export default defineConfig({
  site:
    process.env.SITE_URL ||
    (isGitHubPagesBuild ? inferredGitHubSite : undefined) ||
    'http://localhost:4321',
  base: process.env.BASE_PATH || (isGitHubPagesBuild ? inferredGitHubBase : undefined) || '/',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      wrap: true,
    },
  },
});
