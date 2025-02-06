import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";

export async function createPopup(request: Request) {
  const { admin, session } = await authenticate.admin(request);
  
  try {
    const data = await request.json();
    
    const popup = await prisma.popupConfig.create({
      data: {
        ...data,
        shopId: session.shop,
        displayConditions: JSON.stringify(data.displayConditions),
        targetAudience: JSON.stringify(data.targetAudience),
        design: JSON.stringify(data.design),
        cta: JSON.stringify(data.cta),
        frequency: JSON.stringify(data.frequency),
      },
    });

    return json({ status: 'success', data: popup });
  } catch (error) {
    console.error('Error creating popup:', error);
    return json({ status: 'error', message: 'Failed to create popup' }, { status: 500 });
  }
}

export async function getPopups(request: Request) {
  const { admin, session } = await authenticate.admin(request);
  
  try {
    const popups = await prisma.popupConfig.findMany({
      where: {
        shopId: session.shop,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return json({ status: 'success', data: popups });
  } catch (error) {
    console.error('Error fetching popups:', error);
    return json({ status: 'error', message: 'Failed to fetch popups' }, { status: 500 });
  }
} 