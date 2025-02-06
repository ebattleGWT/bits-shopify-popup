import { DeliveryMethod } from "@shopify/shopify-api";
import { authenticate } from "./shopify.server";

const WEBHOOKS = [
  {
    topic: "APP_INSTALLED",
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/webhooks",
  },
  {
    topic: "APP_UNINSTALLED",
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/webhooks",
  },
];

export async function registerWebhooks(session: { shop: string, accessToken: string }) {
  const { admin } = await authenticate.admin(session);

  try {
    // First, get existing webhooks
    const response = await admin.graphql(`
      query {
        webhookSubscriptions(first: 100) {
          edges {
            node {
              id
              topic
              endpoint {
                __typename
                ... on WebhookHttpEndpoint {
                  callbackUrl
                }
              }
            }
          }
        }
      }
    `);

    const responseJson = await response.json();
    const existingWebhooks = responseJson.data.webhookSubscriptions.edges;

    // Register each required webhook if it doesn't exist
    for (const webhook of WEBHOOKS) {
      const exists = existingWebhooks.some(
        ({ node }: any) => 
          node.topic === webhook.topic && 
          node.endpoint?.callbackUrl?.includes(webhook.callbackUrl)
      );

      if (!exists) {
        await admin.graphql(`
          mutation {
            webhookSubscriptionCreate(
              topic: ${webhook.topic}
              webhookSubscription: {
                callbackUrl: "${process.env.APP_URL}${webhook.callbackUrl}"
                format: JSON
              }
            ) {
              webhookSubscription {
                id
              }
              userErrors {
                field
                message
              }
            }
          }
        `);
        console.log(`Registered ${webhook.topic} webhook for ${session.shop}`);
      }
    }
  } catch (error) {
    console.error(`Failed to register webhooks for ${session.shop}:`, error);
    throw error;
  }
} 