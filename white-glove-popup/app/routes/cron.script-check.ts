import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { checkAndRepairScript } from "../services/script-management.server";
import prisma from "../db.server";

export async function loader({ request }: { request: Request }) {
  // Verify cron secret to ensure this is a legitimate request
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  
  if (secret !== process.env.CRON_SECRET) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all active sessions
    const sessions = await prisma.session.findMany({
      where: {
        isOnline: true,
      },
      select: {
        shop: true,
        accessToken: true,
      },
    });

    const results = {
      total: sessions.length,
      checked: 0,
      repaired: 0,
      failed: 0,
    };

    // Check script installation for each shop
    for (const session of sessions) {
      try {
        await checkAndRepairScript({
          shop: session.shop,
          accessToken: session.accessToken,
        });
        results.checked++;
      } catch (error) {
        console.error(`Failed to check/repair script for ${session.shop}:`, error);
        results.failed++;
      }
    }

    return json({
      message: "Script check completed",
      results,
    });
  } catch (error) {
    console.error("Script check failed:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
} 