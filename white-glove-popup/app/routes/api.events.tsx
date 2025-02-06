import { json, type ActionFunctionArgs } from "@remix-run/node";
import prisma from "../db.server";

type EventData = {
  popupId: string;
  eventType: "IMPRESSION" | "CLICK" | "CLOSE" | "CONVERSION";
  deviceType?: string;
  country?: string;
  page?: string;
  metadata?: Record<string, any>;
  sessionId?: string;
  shop: string;
};

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const data = await request.json() as EventData;
    const { popupId, eventType, deviceType, country, page, metadata, sessionId, shop } = data;

    // Validate required fields
    if (!popupId || !eventType || !shop) {
      return json({ error: "Missing required fields" }, { status: 400 });
    }

    // Record the event
    const event = await prisma.popupEvent.create({
      data: {
        popupId,
        eventType,
        deviceType,
        country,
        page,
        metadata: metadata ? JSON.stringify(metadata) : null,
        sessionId,
        shop,
      },
    });

    // Update metrics
    await prisma.$transaction(async (tx) => {
      // Get or create metrics record
      let metrics = await tx.popupMetrics.findUnique({
        where: { popupId },
      });

      if (!metrics) {
        metrics = await tx.popupMetrics.create({
          data: {
            popupId,
            shop,
          },
        });
      }

      // Update counts based on event type
      const updateData: any = {};
      switch (eventType) {
        case "IMPRESSION":
          updateData.impressions = { increment: 1 };
          break;
        case "CLICK":
          updateData.clicks = { increment: 1 };
          break;
        case "CLOSE":
          updateData.closeCount = { increment: 1 };
          break;
        case "CONVERSION":
          updateData.conversions = { increment: 1 };
          break;
      }

      // Update device breakdown
      if (deviceType) {
        const deviceBreakdown = metrics.deviceBreakdown 
          ? JSON.parse(metrics.deviceBreakdown)
          : {};
        deviceBreakdown[deviceType] = (deviceBreakdown[deviceType] || 0) + 1;
        updateData.deviceBreakdown = JSON.stringify(deviceBreakdown);
      }

      // Update country breakdown
      if (country) {
        const countryBreakdown = metrics.countryBreakdown 
          ? JSON.parse(metrics.countryBreakdown)
          : {};
        countryBreakdown[country] = (countryBreakdown[country] || 0) + 1;
        updateData.countryBreakdown = JSON.stringify(countryBreakdown);
      }

      // Update page breakdown
      if (page) {
        const pageBreakdown = metrics.pageBreakdown 
          ? JSON.parse(metrics.pageBreakdown)
          : {};
        pageBreakdown[page] = (pageBreakdown[page] || 0) + 1;
        updateData.pageBreakdown = JSON.stringify(pageBreakdown);
      }

      // Update metrics
      await tx.popupMetrics.update({
        where: { popupId },
        data: updateData,
      });
    });

    return json({ success: true, event });
  } catch (error) {
    console.error("Failed to record event:", error);
    return json({ error: "Failed to record event" }, { status: 500 });
  }
} 