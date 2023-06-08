import { fileURLToPath } from 'node:url'
import { mergeConfig } from 'vite'
import { configDefaults, defineConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'node',
      testTimeout: 2000,
      watch: false,
      coverage: {
        provider: 'c8',
        reporter: ['text', 'lcov'],
        exclude: ['**/*.spec.ts'],
      },
      setupFiles: ['./vitest-init.ts'],
      exclude: [...configDefaults.exclude, 'e2e/*'],
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
  }),
)
