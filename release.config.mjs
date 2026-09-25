/**
 * semantic-release configuration.
 *
 * Declaring `plugins` replaces semantic-release's defaults, so every plugin we
 * rely on is listed explicitly even though commit-analyzer,
 * release-notes-generator, npm and github ship with semantic-release itself.
 */
export default {
  branches: ['main'],
  plugins: [
    ['@semantic-release/commit-analyzer', { preset: 'conventionalcommits' }],
    ['@semantic-release/release-notes-generator', { preset: 'conventionalcommits' }],
    ['@semantic-release/changelog', { changelogFile: 'CHANGELOG.md' }],
    ['@semantic-release/npm', { npmPublish: true }],
    ['@semantic-release/github', {}],
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json', 'package-lock.json'],
        // `[skip ci]` stops this release commit from re-triggering the workflow.
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
  ],
};
