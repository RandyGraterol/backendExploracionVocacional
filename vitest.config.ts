import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      DB_STORAGE: ':memory:' // Use in-memory database for tests
    },
    setupFiles: [],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    },
    // Run tests sequentially to avoid database conflicts
    pool: 'forks',
    maxConcurrency: 1,
    // Increase timeout for property-based tests
    testTimeout: 30000
  }
});
