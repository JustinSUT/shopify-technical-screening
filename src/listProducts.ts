import { shopifyClient } from './utils/shopifyClient';

const query = `
  query {
    products(first: 10) {
      edges {
        node {
          id
          title
          handle
        }
      }
    }
  }
`;

async function listProducts() {
  try {
    const response = await shopifyClient.request(query);
    console.log(JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Error fetching products:', error);
  }
}

listProducts();