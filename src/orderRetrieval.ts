import { shopifyClient } from './utils/shopifyClient';
import { formatISO, subDays } from 'date-fns';

// Define interfaces for type safety
interface LineItem {
  node: {
    product?: { id: string } | null;
    title: string;
    quantity: number;
  };
}

interface Order {
  node: {
    id: string;
    name: string;
    customer?: {
      firstName: string;
      lastName: string;
    } | null;
    lineItems: {
      edges: LineItem[];
    };
  };
}

interface OrdersResponse {
  orders: {
    edges: Order[];
  };
}

// Update the product ID to match your store's product
// The format should be: gid://shopify/Product/{numeric_id}
const productId = 'gid://shopify/Product/9840647569749'; // Example ID, you'll need to replace with your actual product ID

// Update the GraphQL query to include customer field
const query = `
  query getOrdersWithProduct($queryString: String!) {
    orders(first: 50, query: $queryString) {
      edges {
        node {
          id
          name
          customer {
            firstName
            lastName
          }
          lineItems(first: 50) {
            edges {
              node {
                product {
                  id
                }
                title
                quantity
              }
            }
          }
        }
      }
    }
  }
`;

async function fetchOrdersWithProduct() {
  try {
    // Calculate date 30 days ago
    const thirtyDaysAgo = subDays(new Date(), 30);
    const formattedDate = formatISO(thirtyDaysAgo);

    // Combine both date and product filters in the query string
    const queryString = `created_at:>='${formattedDate}' AND line_items.product_id:'${productId}'`;

    // Execute the query with the combined query string
    const data = await shopifyClient.request<OrdersResponse>(query, {
      queryString,
    });

    // Map the orders (no need to filter since we're filtering in the query)
    const orders = data.orders.edges.map(({ node: order }) => {
      // Extract relevant product items
      const relevantItems = order.lineItems.edges.map(({ node: item }) => ({
        title: item.title,
        quantity: item.quantity,
      }));

      return {
        orderId: order.id,
        orderName: order.name,
        customerName: order.customer 
          ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() 
          : 'Guest',
        items: relevantItems,
      };
    });

    console.log('Orders containing the specified product:');
    console.log(JSON.stringify(orders, null, 2));
    
    console.log(`Found ${orders.length} orders containing the product.`);
    
    return orders;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
}

// Execute the function
fetchOrdersWithProduct();