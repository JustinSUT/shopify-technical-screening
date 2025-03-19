import { shopifyClient } from './utils/shopifyClient';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

interface ProductWebhookPayload {
  id: number;
  title: string;
  variants: Array<{
    id: number;
    price: string;
  }>;
  admin_graphql_api_id: string;
}

interface PriceAlertData {
  title: string;
  oldPrice: number;
  newPrice: number;
  decreasePercentage: number;
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
          decreasePercentage: priceDecrease,
        });
      }
    }
  } catch (error) {
    console.error('Error handling product update webhook:', error);
    throw error;
  }
}

async function sendPriceAlert(data: PriceAlertData) {
  const { title, oldPrice, newPrice, decreasePercentage } = data;

  // Verify email configuration
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('Email configuration missing');
    throw new Error('Email configuration missing');
  }

  const emailContent = {
    from: process.env.EMAIL_USER,  // Your Gmail address
    to: process.env.EMAIL_TO || process.env.EMAIL_USER, // Where to send alerts
    subject: `Price Alert: ${title}`,
    html: `
      <h2>Price Decrease Alert</h2>
      <p><strong>Product:</strong> ${title}</p>
      <p><strong>Old Price:</strong> $${oldPrice.toFixed(2)}</p>
      <p><strong>New Price:</strong> $${newPrice.toFixed(2)}</p>
      <p><strong>Decrease:</strong> ${decreasePercentage.toFixed(2)}%</p>
    `,
  };

  console.log('Attempting to send email alert to:', emailContent.to);
  
  try {
    await transporter.sendMail(emailContent);
    console.log('Email alert sent successfully');
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

// Update the transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Use the App Password here
  },
  debug: true, // Enable debug logs
});

// Verify the transporter works
transporter.verify(function (error, success) {
  if (error) {
    console.error('Email transporter verification failed:', error);
  } else {
    console.log('Email transporter is ready to send messages');
  }
});