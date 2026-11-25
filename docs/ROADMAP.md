# Roadmap

Minirynth is an unofficial mobile client for Modrinth. This file records the current version plan, what is working, and the limits behind the bigger features.

## Version plan

- `0.5.6 Patches` is the current development line.
- `0.5.5-dev Patches` is the previous patch line and stays in the devlog.
- Patch releases stay `-dev` while features are being tested.
- `1.0.0` is the first stable release, used only when the features are ready for normal users.
- Android `versionCode` increments for every versioned build.

## Build notes

- APK builds need JDK 21 at `/mnt/HDD/jdk21/jdk-21.0.7+6`.
- Java 17 is too old and Java 25 is too new for the Gradle version in this repo.
- Builds are copied to `builds/` and `/media/teddz/MAJD-USB/Backups/Minirynth/Builds/` when that drive is mounted.

## Documentation checklist

For every feature slice:

1. Add an entry to `CHANGELOG.md`.
2. Update the feature list and current build in `README.md`.
3. Update the version string in `src/views/SettingsView.vue`.
4. Update `package.json` and `android/app/build.gradle` when the version changes.
5. Run `npm run build:site` so the website picks up the new changelog, roadmap, APK list and stats.
6. Update this file when a feature's status or constraints change.

## Feature status

### Android 17 input lag

Status: fixed and verified in `0.5.6 Patches`. Issue #3 is closed.

- Slight, intermittent input lag on a Galaxy S25 Ultra (SM-S947U, T-Mobile) running Android 17 / One UI 9.0, build CP2A.260605.016.S947USQS6BZK4.
- The whole UI feels unresponsive at times, with a short delay on some button taps.
- Android 16 runs flawlessly, so this looks specific to Android 17 / One UI 9 rather than the app in general.
- FoxyKid23256 is the tester on the affected device. Any fix gets verified there before it ships.
- A read-only audit ruled out the viewport tag, `touch-action`, global transitions and heavy click handlers.
- First attempt landed in `0.5.5-dev`: buttons snap to their pressed state instead of animating the scale. Not yet verified on the affected device.

### Scheduled releases

Status: first slice shipped in `0.5.0-dev`.

- Project releases can be scheduled from the project header.
- Version releases can be scheduled from each version card.
- Uses `POST /project/{id}/schedule` and `POST /version/{id}/schedule`.
- Requires `PROJECT_WRITE` and `VERSION_WRITE`, already requested by the OAuth worker.
- The date picker uses local time and sends ISO-8601 UTC to the API.
- There is no unschedule action yet. Use the Modrinth website to cancel a schedule.
- Scheduling writes real data, so use a test project.

### Remote install into a Modrinth desktop instance

Status: planned, waiting on feedback from Modrinth.

- The Modrinth App stores instances in a local SQLite database.
- The public Modrinth API does not expose local instances or a way to add files to them.
- A PC companion was prototyped with pairing, status check and an Install to PC button, then removed before this build.
- Nothing launches Minecraft.

#### Preferred long-term path: official cloud sync

This is the best version of the feature and needs Modrinth to expose it.

- Modrinth App already has a `modrinth://` deep link, but it is for modpacks, not adding a selected version to a chosen instance.
- Modrinth App has a shared-instances service that syncs content and config between users. Updates are reviewed in the app before they are accepted.
- There is an open Modrinth issue called "Sync instances across devices" that matches this use case: https://github.com/modrinth/code/issues/7459
- The ask is a scoped API for a signed-in user, not a file-writing API:
  - `INSTANCE_READ` to list the user's instances.
  - `INSTANCE_CONTENT_WRITE` to queue a project version into one instance.
  - A pending-actions endpoint so the phone can show whether the PC has applied it.
- The phone would send a small intent, such as project ID, version ID and target instance ID. The Modrinth App would apply it the next time it opens, ideally with the same review prompt used by shared instances.
- That removes the need for a 24/7 companion and keeps the PC in control. Silent auto-install is less likely to be accepted, so the request should be framed as a reviewed pending action.

### Mobile Minecraft launchers

Status: planned, waiting on official support or launcher cooperation.

- Android 11 and newer block apps from writing into other apps' private directories.
- Direct writes into Mojo or Pojav app data are not realistic without root, Shizuku, or launcher cooperation.
- A shared-folder export was prototyped and removed before this build.
- Later steps depend on what intents or content providers each launcher exposes.

### Modrinth Hosting server management

Status: planned, API access unresolved.

- No public Modrinth Hosting server management API was found in the current documentation.
- The goal is to manage Modrinth Hosting servers from the phone: add mods, update packs, and keep content in sync.
- This needs either an official API with proper scopes or a separate agent with credentials the owner controls.

### Collections

Status: shipped in `0.5.3-dev`.

- Projects can be added to existing Modrinth collections from a project page. Collections can also be created and deleted there.
- Uses `COLLECTION_READ`, `COLLECTION_WRITE`, `COLLECTION_CREATE` and `COLLECTION_DELETE` through OAuth.

### Content disclosures and payouts

Status: partly researched, not started.

- Content disclosures appear in search and project fields, but no write endpoint was found.
- Payout endpoints exist but are sensitive and need careful scope handling and clear warnings.
- These stay behind the larger features for now.
