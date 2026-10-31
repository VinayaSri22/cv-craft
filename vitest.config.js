import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    include: ['packages/**/*.test.{js,jsx}', 'apps/**/*.test.{js,jsx}'],
    environment: 'node',
  },
});
