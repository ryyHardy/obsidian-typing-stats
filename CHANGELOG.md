# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- Status bar items for certain stats
- Consistency stat
- Improved stat calculation while switching files

## [1.2.0] - 2026-07-26

### Added

- "File ignore patterns" setting allowing users to stop the collection of typing statistics while in certain files.
- A migration system to ensure existing users' data is properly handled when updating to a newer plugin version.
- Added unit testing setup with vitest. Test cases added for the new file ignore setting and migration system to ensure they continue working.

### Fixed

- "Corrections per second" was misnamed as "Errors per second" in the stats view panel.

## [1.1.0] - 2026-07-20

### Added

- Support for 1.13.0+ (currently insider builds) and the upcoming declarative settings API
- For <1.13.0, improved validation and user feedback for number inputs in the settings

### Fixed

- Validation bug causing the "new burst threshold" setting to be uneditable

## [1.0.0] - 2026-07-16

### Added

- First release! \:D
- Live typing statistics collected from editor changes. Stats include:
  - Active time
  - Bursts
  - Corrections
  - Corrections per minute
  - Total chars added
  - Total chars deleted
  - Net chars
- A view UI displaying stats over multiple days.
- Settings:
  - Enabled
  - Minimum burst duration
  - New burst threshold
- Commands:
  - Toggle typing analysis
  - Open typing stat viewer
