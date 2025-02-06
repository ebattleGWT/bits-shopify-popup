import { json, type LoaderFunctionArgs } from "@remix-run/node";
import prisma from "../db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return json({ error: "Shop parameter is required" }, { status: 400 });
  }

  const popups = await prisma.popup.findMany({
    where: {
      shop,
      isEnabled: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Set cache headers for better performance
  const headers = {
    "Cache-Control": "public, max-age=60", // Cache for 1 minute
  };

  return json({ popups }, { headers });
} 