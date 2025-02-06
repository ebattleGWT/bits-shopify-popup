import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { json } from "@remix-run/node";

export async function loader({ request }: { request: Request }) {
  const { session } = await authenticate.public(request);
  
  try {
    const popups = await prisma.popupConfig.findMany({
      where: {
        shopId: session.shop,
        isEnabled: true,
      },
    });

    return json(popups);
  } catch (error) {
    console.error('Error fetching active popups:', error);
    return json({ error: 'Failed to fetch popups' }, { status: 500 });
  }
} 