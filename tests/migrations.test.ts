import { describe, expect, it } from 'vitest';

import { CURRENT_SCHEMA_VERSION, migratePluginData } from '../src/migrations';

describe('migratePluginData', () => {
  it('migrates data from version 1 to the latest schema', () => {
    const legacyData = {
      settings: {
        enabled: false,
        newBurstThreshold: 3000,
        minBurstDuration: 750,
      },
      history: {
        '2026-07-20': {
          date: '2026-07-20',
          activeSeconds: 95,
          addedChars: 647,
          deletedChars: 15,
          bursts: 1,
          avgWPM: 79,
          corrections: 10,
        },
      },
    };

    const migrated = migratePluginData(legacyData);

    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrated.settings).toMatchObject({
      enabled: false,
      newBurstThreshold: 3000,
      minBurstDuration: 750,
      fileIgnorePatterns: [],
    });
    expect(migrated.history['2026-07-20']).toMatchObject({
      date: '2026-07-20',
      activeSeconds: 95,
      addedChars: 647,
      deletedChars: 15,
      bursts: 1,
      corrections: 10,
    });
    expect(migrated.history['2026-07-20']).not.toHaveProperty('avgWPM');
  });
});
