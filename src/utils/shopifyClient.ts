import { GraphQLClient } from 'graphql-request';
import dotenv from 'dotenv';

dotenv.config();

const shopifyDomain = process.env.SHOPIFY_SHOP;
const accessToken = process.env.SHOPIFY_API_ACCESS_TOKEN;

if (!shopifyDomain || !accessToken) {
  throw new Error('Missing required environment variables: SHOPIFY_SHOP or SHOPIFY_API_ACCESS_TOKEN');
}

const endpoint = `https://${shopifyDomain}/admin/api/2023-07/graphql.json`;

export const shopifyClient = new GraphQLClient(endpoint, {
  headers: {
    'X-Shopify-Access-Token': accessToken,
    'Content-Type': 'application/json',
  },
});