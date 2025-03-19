# Shopify Technical Screening Test

## Environment Setup
1. Clone this repository
2. Install dependencies: `npm install`
3. Create a `.env` file with the following variables:
   ```
   SHOPIFY_SHOP=your-store.myshopify.com
   SHOPIFY_API_ACCESS_TOKEN=your_access_token
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-email-password
   ```

## Running the Solutions

### 1. Liquid Snippet
- Copy the contents of `snippets/product-badge.liquid` to your theme's snippet folder
- Include the snippet in your product template using: `{% render 'product-badge' %}`

### 2. Order Retrieval Script
```bash
ts-node src/orderRetrieval.ts
```

### 3. Webhook Handler
1. Set up webhook in Shopify Admin:
   - Go to Settings > Notifications
   - Add webhook for Product updates
   - Set webhook URL to your endpoint
2. Run the webhook handler:
```bash
ts-node src/webhookHandler.ts
```

## Assumptions
- Development store has sample products
- Store has API access configured
- Email service is Gmail
- Webhook endpoint is publicly accessible

## Testing
1. Product Badge: View any product with a discount
2. Order Retrieval: Script will fetch orders from last 30 days
3. Webhook: Update a product price in admin to trigger notification
