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

## Shopify Headless Integration (Next Step)

The shop page currently has 5 static cards hardcoded in `index.html`. The next phase connects the existing Chief Keef Shopify store as a headless backend — products, inventory, and checkout all come from Shopify, rendered in the existing Three.js/purple UI.

### Architecture

No build step, no framework. The site stays vanilla JS. Shopify is accessed entirely via the **Storefront API** (GraphQL over `fetch()`). The Storefront API access token is a public credential — intentionally client-safe.

```
Browser → Shopify Storefront API (GraphQL)
                ↓
        fetch products → render cards
        add to cart   → create checkout → redirect to Shopify checkout URL
```

Shopify owns the checkout page. No payment handling in this codebase.

---

### Step 1 — Get the Storefront API Token

1. Log in to the Chief Keef Shopify admin
2. Go to **Settings → Apps and sales channels → Develop apps**
3. Create a new app (e.g. `chiefkeef-headless`)
4. Under **API credentials → Storefront API**, enable these scopes:
   - `unauthenticated_read_product_listings`
   - `unauthenticated_read_product_inventory`
   - `unauthenticated_write_checkouts`
   - `unauthenticated_read_checkouts`
5. Copy the **Storefront API access token** — this is a public token, safe to ship in client JS

---

### Step 2 — Add Config to index.html

Add these constants near the top of the inline `<script>` block:

```js
const SHOPIFY_DOMAIN   = 'chiefkeef.myshopify.com';  // your .myshopify.com domain
const SHOPIFY_TOKEN    = 'YOUR_STOREFRONT_ACCESS_TOKEN';
const SHOPIFY_API_URL  = `https://${SHOPIFY_DOMAIN}/api/2024-04/graphql.json`;

async function shopifyFetch(query, variables = {}) {
  const res = await fetch(SHOPIFY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN
    },
    body: JSON.stringify({ query, variables })
  });
  const { data, errors } = await res.json();
  if (errors) console.error('Shopify API error:', errors);
  return data;
}
```

---

### Step 3 — Fetch Products

Replace the static shop cards with a dynamic render. Call this when the shop page becomes active:

```js
const PRODUCTS_QUERY = `
  query Products {
    products(first: 10) {
      edges {
        node {
          id
          title
          handle
          priceRange {
            minVariantPrice { amount currencyCode }
          }
          images(first: 1) {
            edges { node { url altText } }
          }
          variants(first: 1) {
            edges { node { id availableForSale } }
          }
        }
      }
    }
  }
`;

async function loadShopProducts() {
  const data = await shopifyFetch(PRODUCTS_QUERY);
  const products = data.products.edges.map(e => e.node);
  renderShopCards(products);
}

function renderShopCards(products) {
  const grid = document.querySelector('#page-shop .shop-grid');
  if (!grid) return;
  grid.innerHTML = products.map(p => {
    const img   = p.images.edges[0]?.node.url || '';
    const alt   = p.images.edges[0]?.node.altText || p.title;
    const price = parseFloat(p.priceRange.minVariantPrice.amount).toFixed(2);
    const variantId = p.variants.edges[0]?.node.id || '';
    const inStock   = p.variants.edges[0]?.node.availableForSale;
    return `
      <div class="shop-card" data-variant="${variantId}">
        <div class="shop-card-img-wrap">
          <img src="${img}" alt="${alt}" loading="lazy" onerror="this.style.opacity='0'">
        </div>
        <div class="shop-card-info">
          <div class="shop-card-title">${p.title}</div>
          <div class="shop-card-price">$${price}</div>
          <button class="shop-card-btn" onclick="addToCart('${variantId}')" ${!inStock ? 'disabled' : ''}>
            ${inStock ? 'Add to Cart' : 'Sold Out'}
          </button>
        </div>
      </div>`;
  }).join('');
}
```

---

### Step 4 — Cart and Checkout

Shopify headless checkout: create a cart, get a `checkoutUrl`, redirect the user.

```js
let cartId = null;

const CREATE_CART = `
  mutation CartCreate($lines: [CartLineInput!]) {
    cartCreate(input: { lines: $lines }) {
      cart { id checkoutUrl }
      userErrors { field message }
    }
  }
`;

const ADD_LINE = `
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { id checkoutUrl totalQuantity }
    }
  }
`;

async function addToCart(variantId) {
  if (!cartId) {
    const data = await shopifyFetch(CREATE_CART, {
      lines: [{ merchandiseId: variantId, quantity: 1 }]
    });
    cartId = data.cartCreate.cart.id;
    updateCartCount(1);
  } else {
    await shopifyFetch(ADD_LINE, {
      cartId,
      lines: [{ merchandiseId: variantId, quantity: 1 }]
    });
    updateCartCount();
  }
}

async function goToCheckout() {
  if (!cartId) return;
  const CART_QUERY = `query Cart($id: ID!) { cart(id: $id) { checkoutUrl } }`;
  const data = await shopifyFetch(CART_QUERY, { id: cartId });
  window.location.href = data.cart.checkoutUrl;
}
```

---

### Step 5 — Hook into Page Navigation

Call `loadShopProducts()` when the shop page activates. Find `navigateTo` in `index.html` (~line 3023) and add:

```js
// Inside navigateTo, after the page switch:
if (page === 'page-shop') loadShopProducts();
```

---

### Product Detail Page (product.html)

`product.html` currently uses hardcoded product data. To make it dynamic:

1. Pass the product handle in the URL: `product.html?handle=tee-skull-cluster`
2. On load, read `new URLSearchParams(location.search).get('handle')`
3. Fetch via:

```js
const PRODUCT_QUERY = `
  query Product($handle: String!) {
    productByHandle(handle: $handle) {
      title
      descriptionHtml
      images(first: 10) { edges { node { url altText } } }
      variants(first: 20) {
        edges {
          node {
            id title price { amount } availableForSale
            selectedOptions { name value }
          }
        }
      }
    }
  }
`;
```

---

### Environment Setup

The Storefront token is a **public** credential — it's safe in client JS. It cannot access orders, customer PII, or admin data. Keep the Shopify Admin API key (if needed for webhooks or server-side ops) in Vercel environment variables only, never in `index.html`.

| Credential | Where to store | Notes |
|---|---|---|
| Storefront API token | Inline in `index.html` | Public, client-safe |
| `.myshopify.com` domain | Inline in `index.html` | Not sensitive |
| Admin API key | Vercel env vars only | Never client-side |

---

### References

- [Shopify Storefront API docs](https://shopify.dev/docs/api/storefront)
- [Cart API reference](https://shopify.dev/docs/api/storefront/2024-04/mutations/cartCreate)
- [GraphQL explorer](https://shopify.dev/docs/apps/tools/graphiql-storefront-api)

---

## Repo

| | |
|---|---|
| GitHub | https://github.com/f-x-dx/chiefkeef.com |
| Org | [f-x-dx](https://github.com/f-x-dx) — Integral Studio |
| Branch | `main` → production |
