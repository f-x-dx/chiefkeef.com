/**
 * /api/holder-products.js
 * Vercel Serverless Function - Token-gated Shopify product access
 *
 * This endpoint:
 * 1. Receives a wallet address
 * 2. Verifies $SOSA token balance via Solana RPC
 * 3. If balance >= threshold, returns holder-exclusive products from Shopify
 * 4. If balance = 0, returns 403 Forbidden
 *
 * ENV VARS REQUIRED (set in Vercel dashboard):
 * - SHOPIFY_STOREFRONT_TOKEN: Storefront API access token (server-side only)
 * - SHOPIFY_DOMAIN: e.g., chiefkeef.myshopify.com
 * - SOSA_MINT_ADDRESS: SPL token mint address for $SOSA
 * - SOLANA_RPC_URL: Helius/QuickNode RPC endpoint (rate-limited)
 *
 * BLOCKED: Awaiting Shopify admin access to create custom app and get token
 */

const { Connection, PublicKey } = require('@solana/web3.js');

// Token gate configuration
const SOSA_MINT = process.env.SOSA_MINT_ADDRESS || 'PLACEHOLDER_MINT_ADDRESS';
const SOLANA_RPC = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const HOLDER_THRESHOLD = 1; // Minimum $SOSA balance required (adjust as needed)

// Shopify configuration
const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN || 'chiefkeef.myshopify.com';
const SHOPIFY_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN || '';
const HOLDER_COLLECTION = 'holders-only'; // Collection handle for holder-exclusive products

/**
 * Check if wallet holds $SOSA tokens
 */
async function checkSosaBalance(walletAddress) {
  try {
    const connection = new Connection(SOLANA_RPC, 'confirmed');
    const walletPubkey = new PublicKey(walletAddress);
    const mintPubkey = new PublicKey(SOSA_MINT);

    // Get all token accounts for this wallet that hold $SOSA
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(walletPubkey, {
      mint: mintPubkey,
    });

    // Sum up balance across all accounts (usually just one)
    let totalBalance = 0;
    for (const account of tokenAccounts.value) {
      const parsed = account.account.data.parsed;
      if (parsed && parsed.info && parsed.info.tokenAmount) {
        totalBalance += Number(parsed.info.tokenAmount.uiAmount || 0);
      }
    }

    return totalBalance;
  } catch (err) {
    console.error('Solana RPC error:', err.message);
    // If mint address is placeholder, return mock balance for development
    if (SOSA_MINT === 'PLACEHOLDER_MINT_ADDRESS') {
      console.log('Using mock balance (placeholder mint)');
      return 300; // Mock: return holder-level balance
    }
    throw err;
  }
}

/**
 * Fetch holder-exclusive products from Shopify Storefront API
 */
async function fetchHolderProducts() {
  // BLOCKED: No Shopify token yet - return mock data
  if (!SHOPIFY_TOKEN) {
    console.log('SHOPIFY_STOREFRONT_TOKEN not set - returning mock products');
    return getMockHolderProducts();
  }

  const query = `
    query GetHolderProducts {
      collection(handle: "${HOLDER_COLLECTION}") {
        products(first: 20) {
          edges {
            node {
              id
              handle
              title
              description
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
              images(first: 1) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    availableForSale
                    price {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch(`https://${SHOPIFY_DOMAIN}/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.errors) {
    console.error('Shopify GraphQL errors:', data.errors);
    throw new Error('Shopify query failed');
  }

  // Transform Shopify response to our format
  const products = data.data?.collection?.products?.edges || [];
  return products.map(({ node }) => ({
    id: node.id,
    handle: node.handle,
    title: node.title,
    description: node.description,
    price: node.priceRange.minVariantPrice.amount,
    currency: node.priceRange.minVariantPrice.currencyCode,
    image: node.images.edges[0]?.node?.url || null,
    imageAlt: node.images.edges[0]?.node?.altText || node.title,
    variants: node.variants.edges.map(({ node: v }) => ({
      id: v.id,
      title: v.title,
      available: v.availableForSale,
      price: v.price.amount,
    })),
    holderExclusive: true,
  }));
}

/**
 * Mock holder products for development (before Shopify access)
 */
function getMockHolderProducts() {
  return [
    {
      id: 'mock-holder-1',
      handle: 'sosa-coin-hoodie-exclusive',
      title: 'SOSA COIN HOODIE (HOLDER EXCLUSIVE)',
      description: 'Limited edition $SOSA holder-only hoodie. Purple coin embroidery. Only available to verified token holders.',
      price: '200',
      currency: 'USD',
      image: '/assets/shop/hoodie-skull-script-front.png',
      imageAlt: 'Sosa Coin Exclusive Hoodie',
      variants: [
        { id: 'mock-v1', title: 'S', available: true, price: '200' },
        { id: 'mock-v2', title: 'M', available: true, price: '200' },
        { id: 'mock-v3', title: 'L', available: true, price: '200' },
        { id: 'mock-v4', title: 'XL', available: false, price: '200' },
      ],
      holderExclusive: true,
    },
    {
      id: 'mock-holder-2',
      handle: 'almighty-so-vinyl-holder',
      title: 'ALMIGHTY SO 2 VINYL (HOLDER EARLY ACCESS)',
      description: 'Limited press vinyl. Holder-exclusive purple splatter variant. Ships before public release.',
      price: '75',
      currency: 'USD',
      image: '/assets/shop/crew-skull-cluster-front.png',
      imageAlt: 'Almighty So 2 Vinyl',
      variants: [
        { id: 'mock-v5', title: 'Standard', available: true, price: '75' },
      ],
      holderExclusive: true,
    },
    {
      id: 'mock-holder-3',
      handle: 'glo-gang-chain-holder',
      title: 'GLO GANG CHAIN (HOLDER DROP)',
      description: '18k gold plated Glo Gang pendant. Serial numbered. Certificate of authenticity included.',
      price: '350',
      currency: 'USD',
      image: '/assets/shop/tee-skull-cluster-front.png',
      imageAlt: 'Glo Gang Chain',
      variants: [
        { id: 'mock-v6', title: 'One Size', available: true, price: '350' },
      ],
      holderExclusive: true,
    },
  ];
}

/**
 * Main handler
 */
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { walletAddress } = req.body || {};

  if (!walletAddress) {
    return res.status(400).json({ error: 'walletAddress required' });
  }

  // Validate wallet address format (Solana base58, 32-44 chars)
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress)) {
    return res.status(400).json({ error: 'Invalid wallet address format' });
  }

  try {
    // Check $SOSA balance
    const balance = await checkSosaBalance(walletAddress);

    console.log(`Wallet ${walletAddress.slice(0, 8)}... has ${balance} $SOSA`);

    if (balance < HOLDER_THRESHOLD) {
      return res.status(403).json({
        error: 'Insufficient $SOSA balance',
        required: HOLDER_THRESHOLD,
        balance: balance,
      });
    }

    // Fetch holder-exclusive products
    const products = await fetchHolderProducts();

    return res.status(200).json({
      success: true,
      balance: balance,
      products: products,
    });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
