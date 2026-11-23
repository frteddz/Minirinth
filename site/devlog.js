export const devlog = [
  {
    "version": "0.5.4-dev The Anywhere Update",
    "date": "2026-11-23",
    "groups": [
      {
        "title": "Fixed",
        "items": [
          "Game version dropdown no longer opens the keyboard when it opens. Enter closes the keyboard and leaves the dropdown open."
        ]
      },
      {
        "title": "Improved",
        "items": [
          "Manage content viewer shows project icons for files downloaded through Minirynth, with a letter fallback for the rest.",
          "Settings version label now reads from `package.json` like the profile footer, and the API User-Agent matches the build.",
          "Coming soon list now reflects the folder features that already shipped.",
          "Added Ko-fi, Modrinth, repo and CurseForge links to the dev site footer."
        ]
      }
    ]
  },
  {
    "version": "0.5.3-dev The Anywhere Update",
    "date": "2026-11-23",
    "groups": [
      {
        "title": "Added",
        "items": [
          "Launcher folders page from the menu, with instances, manual content folder entry and auto-detect from a picked root folder.",
          "Native Android folder picker using Storage Access Framework, with permission kept across restarts.",
          "Download to instance in the download dialog. Mods, resource packs, shaders and data packs go to their matching folder automatically.",
          "Data packs use the standard `datapacks` folder in each instance.",
          "Warning when auto-detect cannot find a standard folder, with manual override.",
          "Instance viewer page with a tab per content folder, file sizes and dates, and delete with confirmation.",
          "Files downloaded through Minirynth are recorded locally, so the viewer shows their exact project and version. Files added elsewhere show as Unknown.",
          "The viewer opens from a labelled Manage content button, so it is not mistaken for opening a file manager.",
          "Removing an instance asks for confirmation, and both delete controls are red bordered buttons.",
          "Game version filters now load from Modrinth's game version tags, so versions like 1.21.10 show up without an app update. The old hardcoded list stays as a fallback if that request fails.",
          "Save projects to your Modrinth collections from the project page, and create or delete collections there too.",
          "Resource pack resolution filters now bold the scale value and no longer show tag icons.",
          "A Collections page from the hamburger menu, with create, edit and delete for Modrinth collections.",
          "Collection detail pages to view the projects inside and remove them from the collection."
        ]
      },
      {
        "title": "Fixed",
        "items": [
          "Opening the hamburger menu now closes the filter sheet instead of leaving both popups up.",
          "The hamburger menu popover follows the selected theme instead of staying dark.",
          "The OAuth worker now always includes the collection scopes, even when an older `OAUTH_SCOPES` variable is set.",
          "Version labels on the profile and dev site now come from `package.json`, and the notification runner User-Agent is current.",
          "Collection dialog buttons are lighter and match the rest of the app.",
          "Clicking a collection row opens it. The separate View button is gone.",
          "Coming soon list and Get updates form now line up with their section headings on the dev site.",
          "Shortened the Coming soon and Get updates subtitles on the dev site.",
          "Devlog now has a search bar, a filter menu, and full-height grouping lines that mark releases from the same update line, without text labels. Tightened the space the lines take and hid them on small screens."
        ]
      }
    ]
  },
  {
    "version": "0.5.0-dev The Anywhere Update",
    "date": "2026-11-23",
    "groups": [
      {
        "title": "Added",
        "items": [
          "Schedule project releases from the project page.",
          "Schedule version releases from each version card.",
          "A shared schedule dialog with local time entry, status selection and future-time validation."
        ]
      }
    ]
  },
  {
    "version": "0.4.7-dev The Creator Tools Update",
    "date": "2026-11-23",
    "groups": [
      {
        "title": "Added",
        "items": [
          "Delete project with confirmation.",
          "Project icon upload and removal in the project edit dialog.",
          "Gallery image metadata editing for title, description, featured flag and ordering.",
          "Version file upload and removal, and version dependencies in the version edit dialog.",
          "Moving projects into organizations and back out to a chosen owner.",
          "Organization member role editing and ownership transfer.",
          "`PROJECT_DELETE` and `PROJECT_READ` added to the OAuth scopes. `PROJECT_READ` is needed to see private organizations.",
          "The temporary 5-second notification test button stays for testing.",
          "Gallery captions now float over the image with a centered gradient overlay.",
          "The saved session is restored once when the app starts, so refreshing any page keeps you signed in.",
          "Organization pages now use compact cards with small inline actions instead of full-width buttons."
        ]
      }
    ]
  },
  {
    "version": "0.4.6-dev The Creator Tools Update",
    "date": "2026-11-23",
    "groups": [
      {
        "title": "Added",
        "items": [
          "Version upload form on project pages for owners, admins and moderators, with files, game versions, loaders, release channel, environment and status.",
          "Create project page with title, slug, summary, Markdown body, project type, tags, license, requested status and optional icon.",
          "`PROJECT_CREATE`, `VERSION_CREATE`, `VERSION_WRITE` and `VERSION_DELETE` added to the OAuth scopes requested by the auth worker.",
          "Gallery image upload and delete, with confirmation on delete.",
          "Version editing and delete, with confirmation on delete.",
          "Project header actions now split by edit permission: editors get a green Edit project button with circular download and follow buttons, everyone else gets a green Download button and a circular follow button.",
          "File pickers and checkboxes in creator dialogs now follow the app theme, with touch-sized controls.",
          "Gallery delete is now a small transparent trash button in the top-right corner of each image.",
          "Version cards are tighter: edit and delete are icon buttons in the header, and the download filename and Modrinth link share one compact footer row. All icon controls are 44px touch targets.",
          "Added icons for the Audio, Blocks, Core Shaders, Entities, Environment, Fonts, GUI, Items, Locale and Models filters.",
          "Dialog close buttons are now 44px touch targets with a larger X icon.",
          "Organization support: list, view, create, edit, accept or decline invites, leave, invite and remove members, and change or delete the organization icon.",
          "`ORGANIZATION_CREATE`, `ORGANIZATION_READ` and `ORGANIZATION_WRITE` added to the OAuth scopes.",
          "Organizations now use the building icon in the menu and as the fallback when an organization has no icon.",
          "The Profile menu item is hidden until you are signed in.",
          "Signing out removes the current account and switches to another saved account if one exists.",
          "Switch account is hidden until you are signed in, and Sign in sits at the top of the menu with an outline border."
        ]
      }
    ]
  },
  {
    "version": "0.4.5-dev The Creator Tools Update",
    "date": "2026-11-23",
    "groups": [
      {
        "title": "Added",
        "items": [
          "Owner and admin editing for projects from the project page.",
          "Edit form for title, summary, Markdown description, featured and additional tags, license ID and URL, issues/source/wiki/Discord links, client and server side, requested status, and donation links.",
          "`PROJECT_WRITE` added to the OAuth scopes requested by the auth worker."
        ]
      }
    ]
  },
  {
    "version": "0.4.4-dev The Creator Tools Update",
    "date": "2026-11-22",
    "groups": [
      {
        "title": "Added",
        "items": [
          "Minirynth `ic_stat` notification icons at all five Android densities."
        ]
      },
      {
        "title": "Changed",
        "items": [
          "Notifications now use the Minirynth mark in the status bar and shade, tinted with the green brand color instead of the default info icon."
        ]
      }
    ]
  },
  {
    "version": "0.4.3-dev The Creator Tools Update",
    "date": "2026-11-22",
    "groups": [
      {
        "title": "Added",
        "items": [
          "Android notification channels for each notification sound, plus a silent channel.",
          "Background runner now receives the channel map and picks the channel for each notification type."
        ]
      },
      {
        "title": "Changed",
        "items": [
          "System notifications now use the sound picked in Settings instead of the default channel sound.",
          "Turning a sound off routes that notification to the silent channel."
        ]
      }
    ]
  },
  {
    "version": "0.4.2-dev The Creator Tools Update",
    "date": "2026-11-22",
    "groups": [
      {
        "title": "Added",
        "items": [
          "Temporary \"Test notification in 5s\" button in Settings with a visible countdown.",
          "Test notifications are posted as heads-up notifications while the app is on screen."
        ]
      }
    ]
  },
  {
    "version": "0.4.1-dev The Creator Tools Update",
    "date": "2026-11-22",
    "groups": [
      {
        "title": "Fixed",
        "items": [
          "Release APKs are signed with the standard Android debug key. The 0.4.0-dev build was rejected as an invalid package because it was unsigned."
        ]
      }
    ]
  },
  {
    "version": "0.4.0-dev The Creator Tools Update",
    "date": "2026-11-22",
    "groups": [
      {
        "title": "Added",
        "items": [
          "`@capacitor/local-notifications` and `@capacitor/background-runner` as dependencies.",
          "Notification permission request on sign-in and from Settings.",
          "Real system notifications from the 5-second test buttons, new in-app notifications, and the background runner.",
          "Background polling every 15 minutes so notifications can still arrive when the app is in the background or closed."
        ]
      }
    ]
  },
  {
    "version": "0.3.0-dev The Creator Update",
    "date": "2026-11-22",
    "groups": [
      {
        "title": "Added",
        "items": [
          "Login with Modrinth OAuth, with a native deep link and a web callback for testing.",
          "Saved accounts with a switcher in the menu that swaps sessions without logging out.",
          "Dashboard and analytics for published projects, with sorting, a chart and a breakdown table.",
          "Notifications on their own page with an unread badge in the menu dock.",
          "Public user profiles, reachable from authors and project members.",
          "Feeling lucky on browse pages.",
          "Gallery viewer with swipe, next and previous, captions and image downloads.",
          "Eight themes.",
          "Notification sound editor with per-sound volume and test buttons.",
          "About and Credits pages, plus a version label in profile and settings."
        ]
      },
      {
        "title": "Fixed",
        "items": [
          "OAuth now asks for the scopes the app needs, including USER_WRITE.",
          "Native login lands back in the app instead of a browser tab.",
          "Switching accounts no longer logs you out.",
          "Log out asks first, then forgets the account on this device."
        ]
      },
      {
        "title": "Improved",
        "items": [
          "Pages load quicker with cached API reads.",
          "Dashboard and analytics can search and sort projects.",
          "Profile pages can search your projects.",
          "Project members are listed in the More tab and link to their profiles."
        ]
      }
    ]
  },
  {
    "version": "0.2.1-dev",
    "date": "2026-11-22",
    "groups": [
      {
        "title": "Changed",
        "items": [
          "Rebranded from Minirinth to Minirynth after Modrinth staff flagged the \"rinth\" part of the name.",
          "App name, Android package, User-Agent and storage keys now use Minirynth.",
          "Added \"Formerly Minirinth\" to the README."
        ]
      }
    ]
  },
  {
    "version": "0.2.0-dev",
    "date": "2026-11-22",
    "groups": [
      {
        "title": "Added",
        "items": [
          "Project pages with About, Versions, Gallery and More tabs.",
          "Markdown descriptions, gallery images, version list and project links.",
          "Download picker with game version search, release-only filter and loader selection.",
          "Project follows, notifications, mark all as read and notification sounds.",
          "Menu dock with an unread badge and Notifications/Profile shortcuts.",
          "Exported icon set and bundled notification sounds with credits."
        ]
      },
      {
        "title": "Fixed",
        "items": [
          "Raw HTML in project descriptions is cleaned up before rendering.",
          "Download dropdown sits above the dialog instead of behind it.",
          "Background scrolling is locked while the download dialog is open.",
          "Game versions list newest first, with long changelogs collapsed by default."
        ]
      },
      {
        "title": "Changed",
        "items": [
          "Project pages use a full-width header, tabs and action row for phones.",
          "Download and follower stats are larger and easier to read.",
          "Dropdowns show their label above the selected value.",
          "Home copy, login scope help and README were updated."
        ]
      },
      {
        "title": "Removed",
        "items": [
          "Duplicate category chips next to the download and follower stats.",
          "The old profile button in the dock, replaced by the menu popover.",
          "The Links tab name, renamed to More."
        ]
      }
    ]
  },
  {
    "version": "0.1.2-dev",
    "date": "2026-11-21",
    "groups": [
      {
        "title": "Added",
        "items": [
          "Early browse and search build."
        ]
      }
    ]
  },
  {
    "version": "0.1.1-dev",
    "date": "2026-11-21",
    "groups": [
      {
        "title": "Added",
        "items": [
          "Early build with category browsing and project pages."
        ]
      }
    ]
  },
  {
    "version": "0.1.0-dev",
    "date": "2026-11-21",
    "groups": [
      {
        "title": "Added",
        "items": [
          "First Android build."
        ]
      }
    ]
  }
]

export const roadmap = [
  "Deeper support for mobile Minecraft launchers like Mojo. The Android folder picker works now, but I want to support as many launchers as I can, so I'm not promising a specific list or date yet.",
  "Official cloud sync for instances, if Modrinth ever exposes the API for it.",
  "Managing servers from your phone. Adding mods, updating packs and keeping everything in sync while you are away from your pc. This is the one I want most, honestly.",
  "Content disclosures and payouts.",
  "More to come i just don't know what.."
]
