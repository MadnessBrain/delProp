# Workspace Rules — delProp Project

This file contains behavioral constraints and rules for working in the **delProp** repository.

## Versioning & Changelog
1. **Changelog Entry**: Every time changes are introduced, document the notable additions, removals, or changes in [CHANGELOG.md](file:///d:/Projects/delProp/CHANGELOG.md). All changelog entries must be written in Russian.
2. **Version Bump**: Increment the app version string in [manifest.json](file:///d:/Projects/delProp/manifest.json) under the `"version"` key whenever any feature or fix is developed. Bumps should follow semantic versioning.
3. **Custom News Update**: Every time changes/updates are introduced, also append a new custom news item describing the update to [db.json](file:///d:/Projects/delProp/db/db.json) under `"custom_news"`. Ensure each news item has a unique `"id"`.
4. **Commit Changes**: Make sure to commit all source code edits, version bumps, changelog updates, and database updates together in git.
