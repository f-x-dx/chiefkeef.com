/**
 * /api/public-products.js
 * Vercel Serverless Function - Public Shopify products
 *
 * This endpoint fetches public products from the 'public-shop' collection.
 * No authentication required - these are visible to all visitors.
 *
 * Note: For truly public data, this could be fetched client-side.
 * Server-side is used here to:
 * 1. Hide Storefront API token from client bundle
 * 2. Allow server-side caching
 * 3. Normalize response format
 *
 * BLOCKED: Awaiting Shopify admin access
 */

// Shopify configuration
const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN || 'chiefkeef.myshopify.com';
const SHOPIFY_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN || '';
const PUBLIC_COLLECTION = 'public-shop';

/**
 * Fetch public products from Shopify
 */
async function fetchPublicProducts() {
  // BLOCKED: No Shopify token yet - return mock data
  if (!SHOPIFY_TOKEN) {
    console.log('SHOPIFY_STOREFRONT_TOKEN not set - returning mock products');
    return getMockPublicProducts();
  }

  const query = `
    query GetPublicProducts {
      collection(handle: "${PUBLIC_COLLECTION}") {
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
              images(first: 2) {
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
    imageBack: node.images.edges[1]?.node?.url || null,
    variants: node.variants.edges.map(({ node: v }) => ({
      id: v.id,
      title: v.title,
      available: v.availableForSale,
      price: v.price.amount,
    })),
    holderExclusive: false,
  }));
}

/**
 * Mock public products matching current static cards
 */
function getMockPublicProducts() {
  return [
    {
      id: 'mock-pub-1',
      handle: 'tee-skull-script',
      title: 'SKELETOR SKULL SCRIPT TEE',
      description: 'Washed black heavyweight tee. Script front, skull + barbed wire back graphic.',
      price: '75',
      currency: 'USD',
      image: '/assets/shop/tee-skull-script-front.png',
      imageBack: '/assets/shop/tee-skull-script-back.png',
      imageAlt: 'Skeletor Skull Script Tee',
      variants: [
        { id: 'pub-v1', title: 'S', available: true, price: '75' },
        { id: 'pub-v2', title: 'M', available: true, price: '75' },
        { id: 'pub-v3', title: 'L', available: true, price: '75' },
        { id: 'pub-v4', title: 'XL', available: true, price: '75' },
        { id: 'pub-v5', title: '2XL', available: true, price: '75' },
      ],
      holderExclusive: false,
    },
    {
      id: 'mock-pub-2',
      handle: 'tee-skull-cluster',
      title: 'SKELETOR SKULL CLUSTER TEE',
      description: 'Washed black oversized tee. All-over skull cluster back print. GBE chest hit.',
      price: '75',
      currency: 'USD',
      image: '/assets/shop/tee-skull-cluster-front.png',
      imageBack: '/assets/shop/tee-skull-cluster-back.png',
      imageAlt: 'Skeletor Skull Cluster Tee',
      variants: [
        { id: 'pub-v6', title: 'S', available: true, price: '75' },
        { id: 'pub-v7', title: 'M', available: true, price: '75' },
        { id: 'pub-v8', title: 'L', available: false, price: '75' },
        { id: 'pub-v9', title: 'XL', available: true, price: '75' },
      ],
      holderExclusive: false,
    },
    {
      id: 'mock-pub-3',
      handle: 'hoodie-barbed',
      title: 'SKELETOR BARBED WIRE HOODIE',
      description: 'Washed black pullover hoodie. Purple barbed wire graphic back. Oversized fit.',
      price: '145',
      currency: 'USD',
      image: '/assets/shop/hoodie-barbed-front.png',
      imageBack: '/assets/shop/hoodie-barbed-back.png',
      imageAlt: 'Skeletor Barbed Wire Hoodie',
      variants: [
        { id: 'pub-v10', title: 'S', available: true, price: '145' },
        { id: 'pub-v11', title: 'M', available: true, price: '145' },
        { id: 'pub-v12', title: 'L', available: true, price: '145' },
        { id: 'pub-v13', title: 'XL', available: true, price: '145' },
      ],
      holderExclusive: false,
    },
    {
      id: 'mock-pub-4',
      handle: 'hoodie-skull-script',
      title: 'SKELETOR SKULL SCRIPT HOODIE',
      description: 'Washed black heavyweight hoodie. Hand-drawn skull + script back graphic.',
      price: '145',
      currency: 'USD',
      image: '/assets/shop/hoodie-skull-script-front.png',
      imageBack: '/assets/shop/hoodie-skull-script-back.png',
      imageAlt: 'Skeletor Skull Script Hoodie',
      variants: [
        { id: 'pub-v14', title: 'S', available: true, price: '145' },
        { id: 'pub-v15', title: 'M', available: true, price: '145' },
        { id: 'pub-v16', title: 'L', available: true, price: '145' },
        { id: 'pub-v17', title: 'XL', available: false, price: '145' },
      ],
      holderExclusive: false,
    },
    {
      id: 'mock-pub-5',
      handle: 'crew-skull-cluster',
      title: 'SKELETOR SKULL CLUSTER CREW',
      description: 'Black crewneck sweatshirt. Skull cluster back print. Chest logo hit. Dropped shoulders.',
      price: '110',
      currency: 'USD',
      image: '/assets/shop/crew-skull-cluster-front.png',
      imageBack: '/assets/shop/crew-skull-cluster-back.png',
      imageAlt: 'Skeletor Skull Cluster Crewneck',
      variants: [
        { id: 'pub-v18', title: 'S', available: true, price: '110' },
        { id: 'pub-v19', title: 'M', available: true, price: '110' },
        { id: 'pub-v20', title: 'L', available: true, price: '110' },
        { id: 'pub-v21', title: 'XL', available: true, price: '110' },
      ],
      holderExclusive: false,
    },
  ];
}

/**
 * Main handler
 */
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Cache for 5 minutes
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const products = await fetchPublicProducts();
    return res.status(200).json({
      success: true,
      products: products,
    });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
