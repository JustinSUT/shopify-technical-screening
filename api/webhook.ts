import { VercelRequest, VercelResponse } from '@vercel/node';
import { handleProductUpdate, verifyWebhook } from '../src/webhookHandler';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  console.log('Received webhook request:', {
    method: req.method,
    headers: req.headers,
    body: req.body
  });

  // Handle GET requests with a status message
  if (req.method === 'GET') {
    console.log('GET request received');
    return res.status(200).json({ 
      status: 'Webhook endpoint active',
      message: 'Send POST requests to this endpoint to process webhooks'
    });
  }

  // Handle POST requests (actual webhook)
  if (req.method === 'POST') {
    try {
      console.log('Processing POST request');
      const hmacHeader = req.headers['x-shopify-hmac-sha256'] as string;
      
      console.log('Verifying webhook signature');
      if (!hmacHeader || !(await verifyWebhook(JSON.stringify(req.body), hmacHeader))) {
        console.error('Webhook verification failed');
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      console.log('Webhook verified, processing update');
      await handleProductUpdate(req.body);
      console.log('Webhook processed successfully');
      return res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
      console.error('Error processing webhook:', error);
      return res.status(500).json({ message: 'Error processing webhook' });
    }
  }

  console.log(`Method ${req.method} not allowed`);
  return res.status(405).json({ message: 'Method not allowed' });
} 