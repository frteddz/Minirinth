# Copying

The source code of Modrinth's UI library is licensed under the GNU General Public License, Version 3 only, which is provided in the file [LICENSE](../../LICENSE). However, some files listed below are licensed under a different license.

## Copied into Minirinth

`styles/` and `styles/omorphia.scss` come from `@modrinth/assets`. `components/` and `tailwind-preset.ts` come from `@modrinth/ui` and `@modrinth/tooling-config`. Card.vue uses a Lucide icon in place of `@modrinth/assets`, and the button types are trimmed to the parts used here. The remote Inter font import was dropped in favour of the local font in `src/assets/fonts/`. No branding files were copied.

## Modrinth logo

The use of Modrinth branding elements, including but not limited to the wrench-in-labyrinth logo, the landing image, and any variations thereof, is strictly prohibited without explicit written permission from Rinth, Inc. This includes trademarks, logos, or other branding elements.

> All rights reserved. © 2020-2025 Rinth, Inc.

This includes, but may not be limited to, the following files:

- src/components/brand/\*
- src/components/servers/ModrinthServersIcon.vue

## External logos

The following files are owned by their respective copyright holders and must be used within each of their Brand Guidelines:

- src/components/servers/MedalBackgroundImage.vue
