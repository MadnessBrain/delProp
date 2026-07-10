# Workspace Rules — delProp Project

This file contains behavioral constraints and rules for working in the **delProp** repository.

## Versioning & Changelog
1. **Version and Changelog on Every Change**: Always increment the app version in [manifest.json](file:///d:/Projects/delProp/manifest.json) under the `"version"` key and document all modifications in [CHANGELOG.md](file:///d:/Projects/delProp/CHANGELOG.md) (in Russian) for every change/feature.
2. **Custom News on Demand**: Do NOT add new custom news items to [db.json](file:///d:/Projects/delProp/db/db.json) automatically. Only write a news item when the user explicitly requests to do so.
3. **Detailed News Compilation**: When requested, compile all changes logged in `CHANGELOG.md` since the last news item's version, structure them beautifully, and add a single detailed, comprehensive news item under `"custom_news"`. Ensure the news item has a unique `"id"`.
   - **Content Guidelines for News**: Focus ONLY on user-facing features, improvements, and bugs fixed in the UI. Describe changes in plain language, and write detailed usage instructions where necessary (e.g. how the new hierarchical project filter works). **Do NOT** include technical/architectural refactoring details, directory changes, or code restructuring details.
4. **Commit Changes**: Make sure to commit all source code edits, version bumps, changelog updates, and database updates together in git.
