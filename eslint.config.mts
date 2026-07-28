import tseslint from 'typescript-eslint';
import obsidianmd from 'eslint-plugin-obsidianmd';
import globals from 'globals';
import { globalIgnores, defineConfig } from 'eslint/config';

export default defineConfig([
  globalIgnores([
    'node_modules',
    'dist',
    'esbuild.config.mjs',
    'version-bump.mjs',
    'versions.json',
    'main.js',
    'package-lock.json',
    'tsconfig.json',
  ]),
  ...obsidianmd.configs.recommended,
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        projectService: {
          allowDefaultProject: ['eslint.config.mts', 'manifest.json'],
        },
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.json'],
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          // ignoreRestSiblings: true,
        },
      ],
    },
  },
]);
