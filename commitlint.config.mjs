export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Release notes and squash-merged pull request bodies routinely exceed the
    // default 100 character limit, which would otherwise fail the release commit.
    'body-max-line-length': [0, 'always'],
    'footer-max-line-length': [0, 'always'],
  },
};
