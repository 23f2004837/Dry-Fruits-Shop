Place your PWA icon files in this folder:

- `icon-192.png` — 192x192 PNG
- `icon-512.png` — 512x512 PNG

These files are referenced by `public/manifest.webmanifest` and by the PWA plugin configuration.

Additionally, to use the header banner when iOS users choose "Add to Home Screen", copy the app banner image into the public root as `public/baner-header.png`:

1. Copy the existing banner from `src/assets/baner-header.png` to `public/baner-header.png`.
2. The app already includes `<link rel="apple-touch-icon" href="/baner-header.png">` and `apple-mobile-web-app-title` set to `Skydale DryFruits` in `index.html`.

You can replace `public/baner-header.png` with any PNG sized 180x180 (recommended) for best results on iOS.
