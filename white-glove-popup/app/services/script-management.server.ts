import { authenticate } from "../shopify.server";

const SCRIPT_NAME = "Popup Script";

export async function ensureScriptInstalled(session: { shop: string, accessToken: string }) {
  const { admin } = await authenticate.admin({
    shop: session.shop,
    accessToken: session.accessToken,
  });

  try {
    // Check if script is already installed
    const response = await admin.graphql(`
      query {
        scriptTags(first: 10) {
          edges {
            node {
              id
              src
              displayScope
            }
          }
        }
      }
    `);

    const responseJson = await response.json();
    const scriptTags = responseJson.data.scriptTags;

    const scriptUrl = `${process.env.APP_URL}/api/script?shop=${session.shop}`;
    const existingScript = scriptTags.edges.find(
      ({ node }: any) => node.src === scriptUrl
    );

    if (!existingScript) {
      // Install script if not found
      await admin.graphql(`
        mutation {
          scriptTagCreate(input: {
            src: "${scriptUrl}",
            displayScope: ONLINE_STORE
          }) {
            scriptTag {
              id
            }
            userErrors {
              field
              message
            }
          }
        }
      `);
      console.log(`Installed script for shop: ${session.shop}`);
    }
  } catch (error) {
    console.error(`Failed to ensure script for shop ${session.shop}:`, error);
    throw error;
  }
}

export async function removeScript(session: { shop: string, accessToken: string }) {
  const { admin } = await authenticate.admin({
    shop: session.shop,
    accessToken: session.accessToken,
  });

  try {
    // Find and remove script
    const response = await admin.graphql(`
      query {
        scriptTags(first: 10) {
          edges {
            node {
              id
              src
            }
          }
        }
      }
    `);

    const responseJson = await response.json();
    const scriptTags = responseJson.data.scriptTags;

    const scriptUrl = `${process.env.APP_URL}/api/script?shop=${session.shop}`;
    const existingScript = scriptTags.edges.find(
      ({ node }: any) => node.src === scriptUrl
    );

    if (existingScript) {
      await admin.graphql(`
        mutation {
          scriptTagDelete(id: "${existingScript.node.id}") {
            deletedScriptTagId
            userErrors {
              field
              message
            }
          }
        }
      `);
      console.log(`Removed script for shop: ${session.shop}`);
    }
  } catch (error) {
    console.error(`Failed to remove script for shop ${session.shop}:`, error);
    throw error;
  }
}

// Function to check and reinstall script if missing
export async function checkAndRepairScript(session: { shop: string, accessToken: string }) {
  const { admin } = await authenticate.admin({
    shop: session.shop,
    accessToken: session.accessToken,
  });

  try {
    const response = await admin.graphql(`
      query {
        scriptTags(first: 10) {
          edges {
            node {
              id
              src
            }
          }
        }
      }
    `);

    const responseJson = await response.json();
    const scriptTags = responseJson.data.scriptTags;

    const scriptUrl = `${process.env.APP_URL}/api/script?shop=${session.shop}`;
    const scriptExists = scriptTags.edges.some(
      ({ node }: any) => node.src === scriptUrl
    );

    if (!scriptExists) {
      console.log(`Script missing for shop ${session.shop}, reinstalling...`);
      await ensureScriptInstalled(session);
    }
  } catch (error) {
    console.error(`Failed to check script for shop ${session.shop}:`, error);
    throw error;
  }
} 