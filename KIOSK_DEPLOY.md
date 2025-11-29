# Kiosk Deployment Guide

This project is a Vite React app. The repository now includes PWA support and is configured for kiosk-friendly behavior (standalone display, portrait orientation, fullscreen preference).

This document explains how to prepare and package the app for kiosk deployments on Android (TWA via Bubblewrap) and iOS (Capacitor). It also lists exact file changes added to the repo.

---

## Files added/modified (summary)
- `public/manifest.webmanifest` — updated with `orientation`, `display_override` (includes `fullscreen`) and points icons to `/icons/icon-192.png` and `/icons/icon-512.png`.
- `vite.config.js` — switched `vite-plugin-pwa` to `injectManifest` strategy and added manifest fields for kiosk (orientation + display_override). SW filename is `sw.js` in `src/`.
- `src/sw.js` — custom service worker that precaches assets, does immediate activation via `skipWaiting()` and `clients.claim()`, and uses runtime caching strategies.
- `src/components/InstallBanner.jsx` and `src/components/InstallBanner.css` — (previously added) optional install prompt UI.

---

## 1) Manifest details
Your `public/manifest.webmanifest` should include (already updated):

- `display`: `standalone`
- `display_override`: `["fullscreen","standalone"]` — tells supporting user agents they'd prefer fullscreen when possible
- `orientation`: `portrait` — locks orientation on supporting platforms
- `theme_color` and `background_color` as provided
- `icons`: point to real PNG files in `public/icons/` (recommended)

Create real icons (recommended sizes):
- `public/icons/icon-192.png` (192x192)
- `public/icons/icon-512.png` (512x512)

Without real icons, some platforms may not allow install prompts.

---

## 2) Service worker behavior (what I added)
`src/sw.js` uses Workbox helpers (the plugin will inject the precache manifest during build):
- `precacheAndRoute(self.__WB_MANIFEST)` — precaches build assets
- `skipWaiting()` and `clients.claim()` — enables the SW to activate immediately and control pages (helpful for kiosk deployments where you want immediate updates)
- Navigation requests: `NetworkFirst` (tries network, falls back to cache) — keeps kiosk content up-to-date but still works offline briefly
- Static resources (JS/CSS): `StaleWhileRevalidate` — serves cached quickly and updates in background
- Images: `CacheFirst`

If you need more strict offline behavior, adjust strategies (e.g., CacheFirst for navigations).

---

## 3) Build config (Vite)
`vite-plugin-pwa` is configured with `strategies: 'injectManifest'` so your custom `src/sw.js` is used and a precache manifest is injected at build time. The plugin also generates the production service worker file and includes your manifest configuration.

To build production:
```bash
npm run build
npm run preview  # to preview the build locally
```

---

## 4) Android kiosk via TWA (Bubblewrap)
Trusted Web Activity (TWA) packages your PWA inside a minimal Android wrapper and lets it run full-screen without Chrome UI.

Prerequisites:
- Java JDK (11+)
- Android SDK + platform-tools
- Node.js & npm
- Install Bubblewrap (npm):
```
npm install -g @bubblewrap/cli
```

Steps (quick):
1. Ensure your site is hosted on HTTPS and has a valid `manifest.webmanifest` with correct `start_url` and icons.
2. Initialize Bubblewrap in an empty folder (or repo root):
```bash
bubblewrap init --manifest https://your-site.com/manifest.webmanifest
```
This will prompt you for package name, app name, etc. The CLI will generate a `twa-manifest.json`.

3. Sample `twa-manifest.json` (generated) — here's an example you can adapt:
```json
{
  "packageId": "com.example.kioskapp",
  "name": "My Kiosk App",
  "shortName": "Kiosk",
  "host": "your-site.com",
  "launcherName": "My Kiosk App",
  "startUrl": "/",
  "display": "standalone",
  "themeColor": "#0b5fff",
  "backgroundColor": "#ffffff",
  "navigationColor": "#0b5fff",
  "navigationColorDark": "#000000",
  "enableNotifications": false,
  "enableGooglePlayInstant": false
/  // other fields...
}
```

4. Build the TWA (after generating & customizing manifest):
```bash
bubblewrap build
```
This will produce an Android project you can open in Android Studio or build via Gradle.

Notes & changes you may need:
- `packageId` must be unique (reverse domain)
- Make sure the icons used by TWA are high-resolution and configured in Android project
- If you need a kiosk device (locked-down), configure Android device owner or use lockdown tools (managed device profiles) — this is outside the scope of Bubblewrap

Troubleshooting:
- If `bubblewrap init` fails, ensure your manifest is reachable and valid (CORS + HTTPS)
- For fullscreen behavior, TWA delegates display to the WebAPK / Chrome; `display_override` and `display: fullscreen` help signal preference but actual behavior depends on the platform and Chrome version.

---

## 5) Optional: Capacitor for iOS kiosk deployment
iOS does not support TWA. Use Capacitor to wrap the PWA into a native app and distribute via App Store or deploy to supervised devices.

Quick steps (high level):
1. Install Capacitor in your repo:
```bash
npm install @capacitor/core @capacitor/cli --save
npx cap init
```
2. Build your web app for production:
```bash
npm run build
```
3. Copy the built assets into the native project:
```bash
npx cap add ios
npx cap copy
```
4. Open Xcode and configure the app to use `Status bar hidden` and proper `Supported interface orientations` (set to Portrait).
5. To run in kiosk/locked mode on iOS devices, you'll need supervised devices (Apple Configurator or MDM) and set Single App Mode or use Guided Access.

Notes:
- iOS will not respect the `display_override` the same way; wrapping via Capacitor gives you fullscreen control.
- For kiosk mode, you usually use MDM or Apple Configurator to lock the device to the app (Single App Mode) — this is outside this repo.

---

## 6) Recommended next steps (practical)
1. Add real icons to `public/icons/icon-192.png` and `public/icons/icon-512.png`.
2. `npm install` (ensure `vite-plugin-pwa` present). Then run:
```bash
npm run build
npm run preview
```
3. Test installability in Chrome (DevTools -> Application -> Manifest)
4. Initialize Bubblewrap and test TWA packaging; tweak `twa-manifest.json` produced by the tool.
5. If targeting iOS kiosk devices, prepare a Capacitor wrapper and plan for device supervision.

---

If you'd like, I can:
- Generate placeholder icons into `public/icons/` now.
- Run a quick manifest and SW sanity check (file reads) and show the exact final contents.
- Generate a sample `twa-manifest.json` for you with values filled in.

Tell me which of those you want next.
