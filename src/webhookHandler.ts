import { shopifyClient } from './utils/shopifyClient';
import { sendPriceAlert } from './utils/emailService';
import crypto from 'crypto';

interface ProductWebhookPayload {
  id: number;
  title: string;
  variants: Array<{
    id: number;
    price: string;
  }>;
  admin_graphql_api_id: string;
}

// Query to get previous product data
const getProductQuery = `
  query getProduct($id: ID!) {
    product(id: $id) {
      id
      title
      variants(first: 10) {
        edges {
          node {
            id
            price
          }
        }
      }
    }
  }
`;

// Store previous prices (in a real app, use a database)
const productPriceCache: Record<string, number> = {};

export async function verifyWebhook(
  body: string,
  hmacHeader: string
): Promise<boolean> {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('WEBHOOK_SECRET is not set in environment variables');
  }

  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(hmacHeader)
  );
}

export async function handleProductUpdate(
  payload: ProductWebhookPayload
): Promise<void> {
  try {
    console.log('Product updated:', payload.title);
    
    const productId = payload.admin_graphql_api_id;
    const newPrice = parseFloat(payload.variants[0].price);
    
    // If we don't have the old price cached, we can't compare
    if (!productPriceCache[productId]) {
      // Store the current price for future comparisons
      productPriceCache[productId] = newPrice;
      console.log(`Cached initial price for ${payload.title}: $${newPrice}`);
      return;
    }
    
    const oldPrice = productPriceCache[productId];
    
    // Update the cache with the new price
    productPriceCache[productId] = newPrice;
    
    // Calculate price decrease percentage
    if (oldPrice > newPrice) {
      const priceDecrease = ((oldPrice - newPrice) / oldPrice) * 100;
      console.log(`Price decreased by ${priceDecrease.toFixed(2)}% for ${payload.title}`);
      
      // Send alert if price decreased by more than 20%
      if (priceDecrease > 20) {
        await sendPriceAlert({
          title: payload.title,
          oldPrice,
          newPrice,
          percentDecrease: priceDecrease,
        });
      }
    }
  } catch (error) {
    console.error('Error handling product update webhook:', error);
    throw error;
  }
}