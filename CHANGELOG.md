# Changelog

All notable changes to the **delProp** extension will be documented in this file.

## [1.0.2] - 2026-06-26
### Changed
- Fixed news deletion bug: news list in storage (`newsId`) now accumulates instead of overwriting, preventing standard news items from being unblocked/re-appearing when all news (standard + custom) are blocked.
- Fixed race condition check in news cleaner to retry check up to 250ms if class or attribute is not initialized yet.
- Removed football button / Sport-Express configurations from default settings in `background.js` completely.

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
