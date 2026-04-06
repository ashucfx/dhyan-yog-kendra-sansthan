import { getAuthenticatedUser } from "@/lib/auth-user";
import { clearCartForUser, listCartItemsForUser, removeCartItem, setCartItemQuantity } from "@/lib/commerce";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ message: "Please sign in to access your cart." }, { status: 401 });
    }

    const items = await listCartItemsForUser(user.id);
    return Response.json({ items }, { status: 200 });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unable to load cart." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ message: "Please sign in to add products to your cart." }, { status: 401 });
    }

    const { productId, quantity } = (await request.json()) as { productId?: string; quantity?: number };
    if (!productId) {
      return Response.json({ message: "Product id is required." }, { status: 400 });
    }

    const item = await setCartItemQuantity(user.id, productId, Math.max(1, Math.round(quantity ?? 1)));
    const items = await listCartItemsForUser(user.id);
    return Response.json({ item, items }, { status: 200 });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unable to add this product to the cart." },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ message: "Please sign in to update your cart." }, { status: 401 });
    }

    const { productId, quantity } = (await request.json()) as { productId?: string; quantity?: number };
    if (!productId || typeof quantity !== "number") {
      return Response.json({ message: "Product id and quantity are required." }, { status: 400 });
    }

    await setCartItemQuantity(user.id, productId, quantity);
    const items = await listCartItemsForUser(user.id);
    return Response.json({ items }, { status: 200 });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unable to update cart." },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ message: "Please sign in to update your cart." }, { status: 401 });
    }

    const payload = (await request.json().catch(() => ({}))) as { productId?: string };
    if (payload.productId) {
      await removeCartItem(user.id, payload.productId);
    } else {
      await clearCartForUser(user.id);
    }

    const items = await listCartItemsForUser(user.id);
    return Response.json({ items }, { status: 200 });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unable to update cart." },
      { status: 400 }
    );
  }
}
