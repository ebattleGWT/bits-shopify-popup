import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const popupId = url.searchParams.get("popupId");
  const period = url.searchParams.get("period") || "7d"; // 24h, 7d, 30d, all

  if (!session?.shop) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    switch (period) {
      case "24h":
        startDate.setHours(startDate.getHours() - 24);
        break;
      case "7d":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "all":
        startDate = new Date(0); // Beginning of time
        break;
    }

    // Base query
    const baseWhere = {
      shop: session.shop,
      createdAt: {
        gte: startDate,
        lte: now,
      },
      ...(popupId ? { popupId } : {}),
    };

    // Get events
    const events = await prisma.popupEvent.findMany({
      where: baseWhere,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get metrics
    const metrics = await prisma.popupMetrics.findMany({
      where: {
        shop: session.shop,
        ...(popupId ? { popupId } : {}),
      },
      include: {
        popup: {
          select: {
            name: true,
            title: true,
          },
        },
      },
    });

    // Calculate time-based metrics
    const timeSeriesData = await prisma.popupEvent.groupBy({
      by: ['eventType', 'createdAt'],
      where: baseWhere,
      _count: true,
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Process metrics
    const processedMetrics = metrics.map(metric => {
      const conversionRate = metric.impressions > 0 
        ? (metric.conversions / metric.impressions) * 100 
        : 0;
      const clickRate = metric.impressions > 0 
        ? (metric.clicks / metric.impressions) * 100 
        : 0;

      return {
        popupId: metric.popupId,
        popupName: metric.popup.name,
        popupTitle: metric.popup.title,
        impressions: metric.impressions,
        clicks: metric.clicks,
        conversions: metric.conversions,
        closeCount: metric.closeCount,
        conversionRate: Math.round(conversionRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
        avgTimeToClick: metric.avgTimeToClick,
        avgTimeToClose: metric.avgTimeToClose,
        bounceRate: metric.bounceRate,
        deviceBreakdown: metric.deviceBreakdown ? JSON.parse(metric.deviceBreakdown) : {},
        countryBreakdown: metric.countryBreakdown ? JSON.parse(metric.countryBreakdown) : {},
        pageBreakdown: metric.pageBreakdown ? JSON.parse(metric.pageBreakdown) : {},
      };
    });

    // Process time series data
    const timeSeriesProcessed = timeSeriesData.reduce((acc, curr) => {
      const date = curr.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          IMPRESSION: 0,
          CLICK: 0,
          CLOSE: 0,
          CONVERSION: 0,
        };
      }
      acc[date][curr.eventType] = curr._count;
      return acc;
    }, {} as Record<string, any>);

    return json({
      metrics: processedMetrics,
      timeSeries: Object.values(timeSeriesProcessed),
      events: events.slice(0, 100), // Latest 100 events
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
} 