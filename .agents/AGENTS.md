# Workspace Rules — delProp Project

This file contains behavioral constraints and rules for working in the **delProp** repository.

## Versioning & Changelog
1. **Accumulate Changes**: Do not bump versions, update `CHANGELOG.md`, or add a custom news item to `db.json` for every minor change or feature. Instead, accumulate approximately 5 updates/fixes, and then release a single major/consolidated update.
2. **Consolidated Update**: When releasing a consolidated update:
   - Increment the app version string in [manifest.json](file:///d:/Projects/delProp/manifest.json) under the `"version"` key.
   - Document all accumulated changes in [CHANGELOG.md](file:///d:/Projects/delProp/CHANGELOG.md) in Russian.
   - Append a single new custom news item describing the consolidated changes to [db.json](file:///d:/Projects/delProp/db/db.json) under `"custom_news"`. Ensure the news item has a unique `"id"`.
3. **Commit Changes**: Make sure to commit all source code edits, version bumps, changelog updates, and database updates together in git.
