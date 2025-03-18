import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.status(200).json({ 
    message: 'Shopify Technical Screening Test API',
    endpoints: {
      webhook: '/api/webhook'
    }
  });
} 