# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- File ignore list setting for privacy
- Status bar items for certain stats
- Consistency stat
- Improved stat calculation while switching files

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
