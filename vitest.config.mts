import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Mirrors the `@/*` path alias from tsconfig.json.
    alias: { '@': projectRoot },
  },
  test: {
    // happy-dom rather than jsdom: jsdom 27 reaches an ESM-only CSS dependency through
    // `require()`, which only works from Node 20.19 onward. happy-dom has no such chain,
    // so the suite runs on the project's stated Node floor as well as on newer versions.
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}'],
      exclude: ['**/*.d.ts', 'app/**/layout.tsx'],
      // A ratchet against regression rather than a target. Set just below what the suite
      // covers today (statements 42.1, branches 40.2, functions 34.8, lines 42.6), so a
      // drop fails the build while there is still room to land a change before writing
      // its test. Raise these as coverage grows — never lower them to make a build pass.
      thresholds: {
        statements: 40,
        branches: 38,
        functions: 32,
        lines: 40,
      },
    },
  },
});
