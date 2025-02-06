import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";

// GET: List all popups for the current shop
export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  
  const popups = await prisma.popup.findMany({
    where: {
      shop: session.shop,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return json({ popups });
}

// POST: Create a new popup
export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const data = await request.json();
    const popup = await prisma.popup.create({
      data: {
        ...data,
        shop: session.shop,
      }
    });

    return json({ popup }, { status: 201 });
  } catch (error) {
    console.error("Failed to create popup:", error);
    return json(
      { error: "Failed to create popup" },
      { status: 500 }
    );
  }
} 