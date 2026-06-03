module.exports = {
  env: { node: true, es2021: true },
  extends: ['eslint:recommended'],
  parserOptions: { ecmaVersion: 2021 },
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^_|next' }],
    'no-console': 'warn',
    'eqeqeq': 'error',
    'no-var': 'error',
    'prefer-const': 'error'
  },
  ignorePatterns: ['node_modules/', 'coverage/']
};
