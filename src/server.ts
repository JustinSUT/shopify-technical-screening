import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { handleProductUpdate, verifyWebhook } from './webhookHandler';
import { RequestHandler } from 'express';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Add custom interface for Request
interface CustomRequest extends express.Request {
  rawBody: string;
}

// Use raw body parser for webhook verification
app.use(
  bodyParser.json({
    verify: (req: CustomRequest, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

// Add type for the request handler
const webhookHandler: RequestHandler = async (req, res) => {
  try {
    const request = req as CustomRequest;
    const hmacHeader = request.headers['x-shopify-hmac-sha256'] as string;
    
    if (!hmacHeader || !(await verifyWebhook(request.rawBody, hmacHeader))) {
      console.error('Webhook verification failed');
      res.status(401).send('Unauthorized');
      return;
    }
    
    await handleProductUpdate(request.body);
    res.status(200).send('Webhook processed');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Error processing webhook');
  }
};

app.post('/webhooks/products/update', express.json(), webhookHandler);

app.get('/health', (req, res) => {
  res.status(200).send('Server is running');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});