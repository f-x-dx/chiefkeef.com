/**
 * /api/cart.js
 * Vercel Serverless Function - Shopify Cart Management
 *
 * Handles cart operations via Shopify Storefront API:
 * - POST /api/cart?action=create - Create new cart
 * - POST /api/cart?action=add - Add line item
 * - POST /api/cart?action=remove - Remove line item
 * - POST /api/cart?action=get - Get cart contents
 *
 * Cart is identified by Shopify cart ID stored client-side.
 * Wallet-scoped carts are managed by the client (localStorage vs sessionStorage).
 *
 * BLOCKED: Awaiting Shopify admin access
 */

const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN || 'chiefkeef.myshopify.com';
const SHOPIFY_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN || '';

/**
 * Execute Shopify Storefront GraphQL
 */
async function shopifyQuery(query, variables = {}) {
  if (!SHOPIFY_TOKEN) {
    throw new Error('SHOPIFY_STOREFRONT_TOKEN not configured');
  }

  const response = await fetch(`https://${SHOPIFY_DOMAIN}/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.errors) {
    console.error('Shopify GraphQL errors:', data.errors);
    throw new Error(data.errors[0]?.message || 'Shopify query failed');
  }

  return data.data;
}

/**
 * Create a new cart
 */
async function createCart(lines = []) {
  const query = `
    mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart {
          id
          checkoutUrl
          lines(first: 50) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    price {
                      amount
                      currencyCode
                    }
                    product {
                      title
                      handle
                      images(first: 1) {
                        edges {
                          node {
                            url
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          cost {
            totalAmount {
              amount
              currencyCode
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      lines: lines.map(l => ({
        merchandiseId: l.variantId,
        quantity: l.quantity || 1,
      })),
    },
  };

  const data = await shopifyQuery(query, variables);
  const result = data.cartCreate;

  if (result.userErrors?.length > 0) {
    throw new Error(result.userErrors[0].message);
  }

  return transformCart(result.cart);
}

/**
 * Add items to cart
 */
async function addToCart(cartId, lines) {
  const query = `
    mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          id
          checkoutUrl
          lines(first: 50) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    price {
                      amount
                      currencyCode
                    }
                    product {
                      title
                      handle
                      images(first: 1) {
                        edges {
                          node {
                            url
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          cost {
            totalAmount {
              amount
              currencyCode
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    cartId,
    lines: lines.map(l => ({
      merchandiseId: l.variantId,
      quantity: l.quantity || 1,
    })),
  };

  const data = await shopifyQuery(query, variables);
  const result = data.cartLinesAdd;

  if (result.userErrors?.length > 0) {
    throw new Error(result.userErrors[0].message);
  }

  return transformCart(result.cart);
}

/**
 * Remove items from cart
 */
async function removeFromCart(cartId, lineIds) {
  const query = `
    mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart {
          id
          checkoutUrl
          lines(first: 50) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    price {
                      amount
                      currencyCode
                    }
                    product {
                      title
                      handle
                      images(first: 1) {
                        edges {
                          node {
                            url
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          cost {
            totalAmount {
              amount
              currencyCode
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await shopifyQuery(query, { cartId, lineIds });
  const result = data.cartLinesRemove;

  if (result.userErrors?.length > 0) {
    throw new Error(result.userErrors[0].message);
  }

  return transformCart(result.cart);
}

/**
 * Get cart contents
 */
async function getCart(cartId) {
  const query = `
    query getCart($cartId: ID!) {
      cart(id: $cartId) {
        id
        checkoutUrl
        lines(first: 50) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                  product {
                    title
                    handle
                    images(first: 1) {
                      edges {
                        node {
                          url
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        cost {
          totalAmount {
            amount
            currencyCode
          }
        }
      }
    }
  `;

  const data = await shopifyQuery(query, { cartId });
  return data.cart ? transformCart(data.cart) : null;
}

/**
 * Transform Shopify cart to simpler format
 */
function transformCart(cart) {
  return {
    id: cart.id,
    checkoutUrl: cart.checkoutUrl,
    items: cart.lines.edges.map(({ node }) => ({
      lineId: node.id,
      variantId: node.merchandise.id,
      variantTitle: node.merchandise.title,
      productTitle: node.merchandise.product.title,
      productHandle: node.merchandise.product.handle,
      price: node.merchandise.price.amount,
      currency: node.merchandise.price.currencyCode,
      quantity: node.quantity,
      image: node.merchandise.product.images.edges[0]?.node?.url || null,
    })),
    total: cart.cost.totalAmount.amount,
    currency: cart.cost.totalAmount.currencyCode,
  };
}

/**
 * Mock cart for development
 */
let mockCarts = {};

function getMockCart(cartId) {
  return mockCarts[cartId] || null;
}

function createMockCart(lines = []) {
  const id = 'mock-cart-' + Date.now();
  const cart = {
    id,
    checkoutUrl: '#mock-checkout',
    items: lines.map((l, i) => ({
      lineId: `mock-line-${i}`,
      variantId: l.variantId,
      variantTitle: 'M',
      productTitle: 'Mock Product',
      productHandle: 'mock-product',
      price: '75',
      currency: 'USD',
      quantity: l.quantity || 1,
      image: '/assets/shop/tee-skull-script-front.png',
    })),
    total: String(lines.reduce((sum, l) => sum + 75 * (l.quantity || 1), 0)),
    currency: 'USD',
  };
  mockCarts[id] = cart;
  return cart;
}

function addToMockCart(cartId, lines) {
  const cart = mockCarts[cartId];
  if (!cart) return createMockCart(lines);

  lines.forEach((l, i) => {
    const existing = cart.items.find(item => item.variantId === l.variantId);
    if (existing) {
      existing.quantity += l.quantity || 1;
    } else {
      cart.items.push({
        lineId: `mock-line-${Date.now()}-${i}`,
        variantId: l.variantId,
        variantTitle: 'M',
        productTitle: 'Mock Product',
        productHandle: 'mock-product',
        price: '75',
        currency: 'USD',
        quantity: l.quantity || 1,
        image: '/assets/shop/tee-skull-script-front.png',
      });
    }
  });

  cart.total = String(cart.items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0));
  return cart;
}

function removeFromMockCart(cartId, lineIds) {
  const cart = mockCarts[cartId];
  if (!cart) return null;

  cart.items = cart.items.filter(item => !lineIds.includes(item.lineId));
  cart.total = String(cart.items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0));
  return cart;
}

/**
 * Main handler
 */
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action } = req.query;
  const body = req.body || {};

  try {
    let result;

    // Use mock if Shopify not configured
    const useMock = !SHOPIFY_TOKEN;
    if (useMock) {
      console.log('SHOPIFY_STOREFRONT_TOKEN not set - using mock cart');
    }

    switch (action) {
      case 'create':
        result = useMock
          ? createMockCart(body.lines || [])
          : await createCart(body.lines || []);
        break;

      case 'add':
        if (!body.cartId || !body.lines?.length) {
          return res.status(400).json({ error: 'cartId and lines required' });
        }
        result = useMock
          ? addToMockCart(body.cartId, body.lines)
          : await addToCart(body.cartId, body.lines);
        break;

      case 'remove':
        if (!body.cartId || !body.lineIds?.length) {
          return res.status(400).json({ error: 'cartId and lineIds required' });
        }
        result = useMock
          ? removeFromMockCart(body.cartId, body.lineIds)
          : await removeFromCart(body.cartId, body.lineIds);
        break;

      case 'get':
        if (!body.cartId) {
          return res.status(400).json({ error: 'cartId required' });
        }
        result = useMock
          ? getMockCart(body.cartId)
          : await getCart(body.cartId);
        if (!result) {
          return res.status(404).json({ error: 'Cart not found' });
        }
        break;

      default:
        return res.status(400).json({ error: 'Invalid action. Use: create, add, remove, get' });
    }

    return res.status(200).json({ success: true, cart: result });

  } catch (err) {
    console.error('Cart handler error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
