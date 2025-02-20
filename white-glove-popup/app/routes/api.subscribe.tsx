import { json, type ActionFunctionArgs } from "@remix-run/node";
import prisma from "../db.server";

type SubscribeData = {
  email: string;
  popupId: string;
  shop: string;
  metadata?: Record<string, any>;
};

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const data = await request.json() as SubscribeData;
    const { email, popupId, shop, metadata } = data;

    // Validate required fields
    if (!email || !popupId || !shop) {
      return json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return json({ error: "Invalid email format" }, { status: 400 });
    }

    // Check if popup exists and is enabled
    const popup = await prisma.popup.findFirst({
      where: {
        id: popupId,
        shop,
        isEnabled: true,
      },
    });

    if (!popup) {
      return json({ error: "Popup not found or disabled" }, { status: 404 });
    }

    // Create or update subscriber
    const subscriber = await prisma.subscriber.upsert({
      where: {
        email_shop: {
          email,
          shop,
        },
      },
      update: {
        status: "SUBSCRIBED",
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
      create: {
        email,
        shop,
        popupId,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    // Track conversion event
    await prisma.popupEvent.create({
      data: {
        popupId,
        shop,
        eventType: "CONVERSION",
        metadata: JSON.stringify({ email }),
      },
    });

    // Update metrics
    await prisma.popupMetrics.update({
      where: { popupId },
      data: {
        conversions: { increment: 1 },
      },
    });

    return json({ success: true, subscriber });
  } catch (error) {
    console.error("Failed to process subscription:", error);
    return json({ error: "Failed to process subscription" }, { status: 500 });
  }
} 