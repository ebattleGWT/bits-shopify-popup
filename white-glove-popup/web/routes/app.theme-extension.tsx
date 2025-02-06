import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export async function action({ request }: { request: Request }) {
  const { admin } = await authenticate.admin(request);

  try {
    // Get the current theme ID
    const {
      data: { themes },
    } = await admin.rest.get({
      path: "themes",
    });

    const mainTheme = themes.find((theme: any) => theme.role === "main");

    if (!mainTheme) {
      throw new Error("Main theme not found");
    }

    // Add our script tag to the theme.liquid file
    const {
      data: { asset },
    } = await admin.rest.get({
      path: `themes/${mainTheme.id}/assets`,
      query: { "asset[key]": "layout/theme.liquid" },
    });

    const updatedContent = asset.value.replace(
      "</head>",
      `<script src="{{ 'popup.js' | asset_url }}" defer="defer"></script></head>`
    );

    await admin.rest.put({
      path: `themes/${mainTheme.id}/assets`,
      data: {
        asset: {
          key: "layout/theme.liquid",
          value: updatedContent,
        },
      },
    });

    return json({ status: "success" });
  } catch (error) {
    console.error("Error injecting script:", error);
    return json({ status: "error", message: error.message }, { status: 500 });
  }
} 