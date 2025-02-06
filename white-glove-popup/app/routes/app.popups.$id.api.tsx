import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";

// GET: Fetch a single popup
export async function loader({ request, params }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const { id } = params;

  const popup = await prisma.popup.findFirst({
    where: {
      id,
      shop: session.shop,
    },
  });

  if (!popup) {
    return json({ error: "Popup not found" }, { status: 404 });
  }

  return json({ popup });
}

// PUT/PATCH: Update a popup
// DELETE: Delete a popup
export async function action({ request, params }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const { id } = params;

  // Verify popup exists and belongs to shop
  const existingPopup = await prisma.popup.findFirst({
    where: {
      id,
      shop: session.shop,
    },
  });

  if (!existingPopup) {
    return json({ error: "Popup not found" }, { status: 404 });
  }

  try {
    switch (request.method) {
      case "PUT":
      case "PATCH": {
        const data = await request.json();
        const popup = await prisma.popup.update({
          where: { id },
          data: {
            ...data,
            shop: session.shop, // Ensure shop cannot be changed
          },
        });
        return json({ popup });
      }

      case "DELETE": {
        await prisma.popup.delete({
          where: { id },
        });
        return json({ success: true }, { status: 200 });
      }

      default:
        return json({ error: "Method not allowed" }, { status: 405 });
    }
  } catch (error) {
    console.error(`Failed to ${request.method.toLowerCase()} popup:`, error);
    return json(
      { error: `Failed to ${request.method.toLowerCase()} popup` },
      { status: 500 }
    );
  }
} 