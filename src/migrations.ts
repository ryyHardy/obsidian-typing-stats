/**
 * For `data.json`, if we ever push an update with a breaking change to the schema of that file (ex: renaming a stat/setting), we need to migrate existing users from the old version(s) to the new version.
 * This module handles that process.
 *
 * ! When making a change to the plugin data schema, here are the steps you should take.
 * ? For demonstration purposes, suppose our current version is version 3. And your new version is 4.
 *
 * 1. Copy and paste the current schema into here, and name it `LegacyDataV3`.
 * 2. Make your changes to the TypingStatsData schema in `types.ts`.
 * 3. Add an entry to the `MIGRATIONS` constant.
 *   - fromVersion: 3
 *   - toVersion: 4
 *   - migrate: (data: unknown) => V3toV4(data as LegacyDataV3)
 * 4. Implement the migrate function, so for this example, `V3toV4`.
 *   - Take a look at the existing ones to get an idea of how to do it.
 *
 */

import type { TypingStatsSettings } from './settings';
import { TypingStatsData } from './types';

const DEFAULT_SETTINGS: TypingStatsSettings = {
  enabled: true,
  newBurstThreshold: 2000,
  minBurstDuration: 500,
  fileIgnorePatterns: [],
};

type MigrationStep = {
  fromVersion: number;
  toVersion: number;
  migrate: (data: unknown) => unknown;
};

/**
 * || LEGACY USER DATA SCHEMAS
 */

type LegacyDataV1 = {
  settings?: Partial<TypingStatsSettings>;
  history: Record<
    string,
    {
      date: string;
      activeSeconds: number;
      addedChars: number;
      deletedChars: number;
      bursts: number;
      avgWPM: number;
      corrections: number;
    }
  >;
};

/*
 * || MIGRATION FUNCTIONS
 */

function V1toV2(data: LegacyDataV1): TypingStatsData {
  const history = Object.fromEntries(
    Object.entries(data.history ?? {}).map(([dayKey, entry]) => {
      const { avgWPM: _avgWPM, ...rest } = entry;
      return [
        dayKey,
        {
          ...rest,
        },
      ];
    }),
  );

  return {
    schemaVersion: 2,
    settings: {
      ...DEFAULT_SETTINGS,
      ...data.settings,
      fileIgnorePatterns: Array.isArray(data.settings?.fileIgnorePatterns)
        ? data.settings.fileIgnorePatterns
        : [],
    },
    history,
  };
}

const MIGRATIONS: readonly MigrationStep[] = [
  {
    fromVersion: 1,
    toVersion: 2,
    migrate: (data: unknown) => V1toV2(data as LegacyDataV1),
  },
].sort((step1, step2) => step1.toVersion - step2.toVersion);

export const CURRENT_SCHEMA_VERSION =
  MIGRATIONS[MIGRATIONS.length - 1]?.toVersion ?? 1;

export function migratePluginData(data: unknown): TypingStatsData {
  if (!data || typeof data !== 'object') {
    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      settings: DEFAULT_SETTINGS,
      history: {},
    };
  }

  const input = data as Record<string, unknown>;
  let currentVersion =
    typeof input.schemaVersion === 'number' ? input.schemaVersion : 1;

  let result: unknown = data;
  for (const migration of MIGRATIONS) {
    if (migration.fromVersion !== currentVersion) continue;
    result = migration.migrate(result);
    currentVersion = migration.toVersion;
  }
  return result as TypingStatsData;
}
