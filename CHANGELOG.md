# Changelog

Minirynth, formerly Minirinth. Unofficial mobile port for Modrinth.
Every versioned APK stays in `builds/`

The 0.4.x builds are still for testing. 0.4.0 has not shipped.

## 0.4.7-dev - 2026-11-23

### Added

- Delete project with confirmation.
- Project icon upload and removal in the project edit dialog.
- Gallery image metadata editing for title, description, featured flag and ordering.
- Version file upload and removal, and version dependencies in the version edit dialog.
- Moving projects into organizations and back out to a chosen owner.
- Organization member role editing and ownership transfer.
- `PROJECT_DELETE` and `PROJECT_READ` added to the OAuth scopes. `PROJECT_READ` is needed to see private organizations.
- The temporary 5-second notification test button stays for testing.
- Gallery captions now float over the image with a centered gradient overlay.
- The saved session is restored once when the app starts, so refreshing any page keeps you signed in.
- Organization pages now use compact cards with small inline actions instead of full-width buttons.

## 0.4.6-dev - 2026-11-23

### Added

- Version upload form on project pages for owners, admins and moderators, with files, game versions, loaders, release channel, environment and status.
- Create project page with title, slug, summary, Markdown body, project type, tags, license, requested status and optional icon.
- `PROJECT_CREATE`, `VERSION_CREATE`, `VERSION_WRITE` and `VERSION_DELETE` added to the OAuth scopes requested by the auth worker.
- Gallery image upload and delete, with confirmation on delete.
- Version editing and delete, with confirmation on delete.
- Project header actions now split by edit permission: editors get a green Edit project button with circular download and follow buttons, everyone else gets a green Download button and a circular follow button.
- File pickers and checkboxes in creator dialogs now follow the app theme, with touch-sized controls.
- Gallery delete is now a small transparent trash button in the top-right corner of each image.
- Version cards are tighter: edit and delete are icon buttons in the header, and the download filename and Modrinth link share one compact footer row. All icon controls are 44px touch targets.
- Added icons for the Audio, Blocks, Core Shaders, Entities, Environment, Fonts, GUI, Items, Locale and Models filters.
- Dialog close buttons are now 44px touch targets with a larger X icon.
- Organization support: list, view, create, edit, accept or decline invites, leave, invite and remove members, and change or delete the organization icon.
- `ORGANIZATION_CREATE`, `ORGANIZATION_READ` and `ORGANIZATION_WRITE` added to the OAuth scopes.
- Organizations now use the building icon in the menu and as the fallback when an organization has no icon.
- The Profile menu item is hidden until you are signed in.
- Signing out removes the current account and switches to another saved account if one exists.
- Switch account is hidden until you are signed in, and Sign in sits at the top of the menu with an outline border.

## 0.4.5-dev - 2026-11-23

### Added

- Owner and admin editing for projects from the project page.
- Edit form for title, summary, Markdown description, featured and additional tags, license ID and URL, issues/source/wiki/Discord links, client and server side, requested status, and donation links.
- `PROJECT_WRITE` added to the OAuth scopes requested by the auth worker.

## 0.4.4-dev - 2026-11-22

### Added

- Minirynth `ic_stat` notification icons at all five Android densities.

### Changed

- Notifications now use the Minirynth mark in the status bar and shade, tinted with the green brand color instead of the default info icon.

## 0.4.3-dev - 2026-11-22

### Added

- Android notification channels for each notification sound, plus a silent channel.
- Background runner now receives the channel map and picks the channel for each notification type.

### Changed

- System notifications now use the sound picked in Settings instead of the default channel sound.
- Turning a sound off routes that notification to the silent channel.

### Note

- The volume sliders still only affect the in-app sound. Android controls system notification volume per channel.

## 0.4.2-dev - 2026-11-22

### Added

- Temporary "Test notification in 5s" button in Settings with a visible countdown.
- Test notifications are posted as heads-up notifications while the app is on screen.

## 0.4.1-dev - 2026-11-22

### Fixed

- Release APKs are signed with the standard Android debug key. The 0.4.0-dev build was rejected as an invalid package because it was unsigned.

## 0.4.0-dev - 2026-11-22

### Added

- `@capacitor/local-notifications` and `@capacitor/background-runner` as dependencies.
- Notification permission request on sign-in and from Settings.
- Real system notifications from the 5-second test buttons, new in-app notifications, and the background runner.
- Background polling every 15 minutes so notifications can still arrive when the app is in the background or closed.

### Note

- This is polling, not instant push. Android can throttle it, and some phone brands need battery optimization or autostart allowed.

## 0.3.0-dev The Creator Update - 2026-11-22

### Added

- Login with Modrinth OAuth, with a native deep link and a web callback for testing.
- Saved accounts with a switcher in the menu that swaps sessions without logging out.
- Dashboard and analytics for published projects, with sorting, a chart and a breakdown table.
- Notifications on their own page with an unread badge in the menu dock.
- Public user profiles, reachable from authors and project members.
- Feeling lucky on browse pages.
- Gallery viewer with swipe, next and previous, captions and image downloads.
- Eight themes.
- Notification sound editor with per-sound volume and test buttons.
- About and Credits pages, plus a version label in profile and settings.

### Fixed

- OAuth now asks for the scopes the app needs, including USER_WRITE.
- Native login lands back in the app instead of a browser tab.
- Switching accounts no longer logs you out.
- Log out asks first, then forgets the account on this device.

### Improved

- Pages load quicker with cached API reads.
- Dashboard and analytics can search and sort projects.
- Profile pages can search your projects.
- Project members are listed in the More tab and link to their profiles.

## 0.2.1-dev - 2026-11-22

### Changed

- Rebranded from Minirinth to Minirynth after Modrinth staff flagged the "rinth" part of the name.
- App name, Android package, User-Agent and storage keys now use Minirynth.
- Added "Formerly Minirinth" to the README.
- Every versioned APK is kept in `builds/`.

## 0.2.0-dev - 2026-11-22

### Added

- Project pages with About, Versions, Gallery and More tabs.
- Markdown descriptions, gallery images, version list and project links.
- Download picker with game version search, release-only filter and loader selection.
- Project follows, notifications, mark all as read and notification sounds.
- Menu dock with an unread badge and Notifications/Profile shortcuts.
- Exported icon set and bundled notification sounds with credits.

### Fixed

- Raw HTML in project descriptions is cleaned up before rendering.
- Download dropdown sits above the dialog instead of behind it.
- Background scrolling is locked while the download dialog is open.
- Game versions list newest first, with long changelogs collapsed by default.

### Changed

- Project pages use a full-width header, tabs and action row for phones.
- Download and follower stats are larger and easier to read.
- Dropdowns show their label above the selected value.
- Home copy, login scope help and README were updated.

### Removed

- Duplicate category chips next to the download and follower stats.
- The old profile button in the dock, replaced by the menu popover.
- The Links tab name, renamed to More.

## 0.1.2-dev - 2026-11-21

- Early browse and search build.

## 0.1.1-dev - 2026-11-21

- Early build with category browsing and project pages.

## 0.1.0-dev - 2026-11-21

- First Android build.
