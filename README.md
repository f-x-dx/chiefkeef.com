# Chief Keef — Official Site

Official web presence for Chief Keef. Purple skulls Three.js scene with music, shop, tour dates, and a Solana wallet-gated vault.

**Live:** https://chiefkeefcom.vercel.app

---

## Quick Start

No build step. No dependencies to install.

```bash
# Option 1 — open directly
open index.html

# Option 2 — local server (recommended, avoids CORS issues with .glb files)
npx serve .
# → http://localhost:3000
```

---

## File Structure

```
chiefkeef.com/
  index.html          ← entire site lives here (HTML + CSS + JS, all inline)
  product.html        ← individual product detail page
  assets/
    skull.glb           ← primary 3D skull model (Three.js)
    skull-draco.glb     ← Draco-compressed variant (smaller, faster)
    track.m4a           ← audio track (Web Audio API)
    favicon.ico
    favicon-32.png
    apple-touch-icon.png
    og.png              ← social share image (1200×630)
    shop/
      crew-skull-cluster-front.png
      crew-skull-cluster-back.png
      hoodie-barbed-front.png
      hoodie-barbed-back.png
      hoodie-skull-script-front.png
      hoodie-skull-script-back.png
      tee-skull-cluster-front.png
      tee-skull-cluster-back.png
      tee-skull-script-front.png
      tee-skull-script-back.png
```

**Everything is in `index.html`.** CSS is inline in `<style>`, JS is inline at the bottom in `<script>`. No separate files, no framework.

---

## Pages

The site is a single-page app. All pages are in `index.html` and toggled via JS — look for `id="page-*"` divs.

| Page | Element ID | URL Hash | Description |
|---|---|---|---|
| Home | `#page-home` | `/` | Three.js skull hero scene + audio |
| Music | `#page-music` | `#music` | Music cards (Skeletor project) |
| Shop | `#page-shop` | `#shop` | Merch grid — 5 Skeletor items |
| Tour | `#page-tour` | `#tour` | Tour dates |
| Vault | `#page-vault` | `#vault` | Solana wallet-gated content |

Navigation uses `navigateTo('page-name')` — defined around line 3023 in `index.html`.

---

## Design System

| Token | Value | Usage |
|---|---|---|
| `--purple-deep` | `#5B1F9E` | Primary purple, scrollbars, accents |
| `--purple-mid` | `#7B2FBE` | Hover states |
| `--purple-bright` | `#A030E8` | Highlights, glow |
| `--green-toxic` | `#00FF41` | CTA accents |
| `--black-deep` | `#060408` | Page background |
| `--black-mid` | `#0e0b12` | Card backgrounds |
| `--white` | `#f0f0f0` | Body text |

**Fonts:**
- `UnifrakturCook` (700) — blackletter display headings
- `Space Mono` (400, 700) — UI, labels, nav
- `Inter` (300, 400, 600, 700) — body text

All loaded from Google Fonts in `<head>`.

---

## The Vault

The vault section is Solana wallet-gated. Users connect a Solana wallet to unlock content.

**Supported wallets:** Phantom, Solflare, Backpack, any generic Solana provider

**How it works:**
1. User hits the Vault page
2. Prompted to connect a Solana wallet
3. On successful connect, `unlockVault(publicKey)` is called
4. Vault grid unlocks and content becomes visible
5. Connected state persists via `localStorage`

**Demo access:** There's a demo unlock path at line ~3266 (`unlockVault('DEMO...ACCESS')`) — useful for testing without a wallet.

**Token gating:** Currently connection-based (any wallet unlocks). Token gating is stubbed in comments — labelled "Token-gating optional" in the UI.

**Wallet detection logic:** Around line 3156. Checks `window.phantom`, `window.solflare`, `window.backpack` on load.

---

## Making Changes

### Add / update a track (Music page)
Find `id="page-music"` in `index.html`. Add a new `.music-card` div following the existing pattern. The audio player uses `track.m4a` in `assets/` — replace that file for a new track, or update the `src` reference in the audio JS (search for `track.m4a`).

### Update merch (Shop page)
Find `id="page-shop"`. Each product is a card in the `.shop-grid`. Front/back images live in `assets/shop/` — add new images there and reference them in the markup. Product detail goes in `product.html`.

### Update tour dates (Tour page)
Find `id="page-tour"`. Dates are hardcoded in the HTML — edit directly.

### Change the OG / social image
Replace `assets/og.png` with a new 1200×630 PNG.

### 3D scene (Home page)
Three.js scene is in the large `<script>` block at the bottom of `index.html`. Skull models are `assets/skull.glb` and `assets/skull-draco.glb`. The scene uses post-processing (bloom) via Three.js EffectComposer.

---

## Deploy

```bash
# Deploy to production
vercel --prod
```

Requires Vercel CLI authenticated to the Integral Studio team. The project is already linked via `.vercel/project.json` — just run `vercel --prod` from the repo root.

```bash
# First time setup
npm i -g vercel
vercel login
```

**Production URL:** https://chiefkeefcom.vercel.app

---

## Tech Notes

- **No build step** — edit and ship. Changes to `index.html` go live on next `vercel --prod`.
- **Mobile** — gyroscope tilt on iOS (auto-requests on first touch) and Android. `100dvh` viewport, orientation change handled with resize debounce + gyro baseline reset.
- **WebGL context loss** — handled for iOS backgrounding/permission dialogs. `webglcontextrestored` re-initialises the renderer.
- **Audio** — Web Audio API, requires user gesture to start.
- **Performance** — Draco-compressed skull model used where supported. Bloom post-processing is GPU-intensive — test on mobile before adding more passes.

---

## Repo

| | |
|---|---|
| GitHub | https://github.com/f-x-dx/chiefkeef.com |
| Org | [f-x-dx](https://github.com/f-x-dx) — Integral Studio |
| Branch | `main` → production |
