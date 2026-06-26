# Changelog

All notable changes to the **delProp** extension will be documented in this file.

## [1.0.1] - 2026-06-26
### Added
- Created `headerEnabled` setting in popup to allow turning the glassmorphic header bar on/off separately from the timer.

### Changed
- Rolled back the archive tree filter to simple project search + pinning (reverted group selection dropdown/logic) and implemented persistence for the pinned toggle button state (`archiveShowPinnedOnly`).
- Restructured `home/` scripts: split `features.js` and `pivo.js` into modular files (`core.js`, `news.js`, `sidebar.js`, `misc.js`, `header.js`, `header.css`, and `pivo.js`).

## [1.0.0] - 2026-06-19
### Added
- Persistent top glassmorphic header bar.
- Lateness tracking and Monday-Friday time offset calculations.
- Integrated custom corporate news deleting from `db/db.json` and popup configurator.
