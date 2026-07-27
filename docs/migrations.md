# Migrations

## Migrations?

As mentioned in the README, this plugin saves a `data.json` file inside the user's vault to save settings and stats history over time.

The challenge is that whenever the schema of `data.json` needs to be updated in any way, we need to handle existing users that still have the old version of the file. We can't just delete their data and start fresh every time. We need to keep it safe.

So, we have a migration setup!

## How it works

Each version of `data.json` has a number. When the plugin starts, we see if that number is lower than the latest version number. If that is the case, we update it from one version to the next until reach the latest version.

For example, suppose the user's `data.json` version is 1, and the latest version is 3. We convert from version 1 to 2, and then version 2 to 3.

Think of it as a pipeline that can take you from version 1 all the way to the latest version.

By doing it this way, we keep users updated without losing any of their information. This means that users should never need to worry about their data being wiped/corrupted when updating the plugin.

## For contributors

The migration setup is implemented in `migrations.ts`. It also has a test case to ensure it continues to work. That file includes more notes on how to work with the migration setup as a developer for this plugin.
