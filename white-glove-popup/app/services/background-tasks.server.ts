import prisma from "../db.server";
import { checkAndRepairScript } from "./script-management.server";

const MONITORING_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

let monitoringInterval: NodeJS.Timeout | null = null;

export async function startBackgroundTasks() {
  if (monitoringInterval) {
    return; // Already running
  }

  // Initial check
  await checkAllShops();

  // Set up periodic checks
  monitoringInterval = setInterval(checkAllShops, MONITORING_INTERVAL);
}

export function stopBackgroundTasks() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
}

async function checkAllShops() {
  console.log("Starting periodic script check...");

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

    console.log("Periodic script check completed:", results);
  } catch (error) {
    console.error("Failed to perform periodic script check:", error);
  }
} 