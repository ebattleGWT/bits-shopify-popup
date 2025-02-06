import { authenticate } from "../shopify.server";
import { ensureScriptInstalled, removeScript } from "../services/script-management.server";
import prisma from "../db.server";

export const action = async ({ request }: { request: Request }) => {
  const { topic, shop, session } = await authenticate.webhook(request);

  if (!session?.shop || !session?.accessToken) {
    console.error("Missing session data in webhook");
    return new Response("Missing session data", { status: 400 });
  }

  switch (topic) {
    case "APP_INSTALLED":
      // Install the script when the app is installed
      await ensureScriptInstalled({
        shop: session.shop,
        accessToken: session.accessToken,
      });
      break;

    case "APP_UNINSTALLED":
      // Remove the script and clean up data when the app is uninstalled
      await removeScript({
        shop: session.shop,
        accessToken: session.accessToken,
      });
      
      // Clean up shop data
      await prisma.popup.deleteMany({
        where: { shop },
      });
      break;
  }

  return new Response();
}; 