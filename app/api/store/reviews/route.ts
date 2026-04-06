import { createProductReview, getProductReviews, loadCommerceSnapshot } from "@/lib/commerce";
import { getAuthenticatedUser } from "@/lib/auth-user";
import { assertRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    assertRateLimit(request, { key: "product-review", limit: 8, windowMs: 60_000 });

    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ message: "Please sign in before posting a review." }, { status: 401 });
    }

    const payload = (await request.json()) as {
      productId?: string;
      rating?: number;
      comment?: string;
    };

    if (!payload.productId || !payload.comment || !payload.rating) {
      return Response.json({ message: "Product, rating, and comment are required." }, { status: 400 });
    }

    const review = await createProductReview({
      productId: payload.productId,
      author: user.name || user.email,
      rating: payload.rating,
      comment: payload.comment
    });

    const snapshot = await loadCommerceSnapshot();
    const summary = getProductReviews(snapshot, payload.productId);

    return Response.json(
      {
        message: "Review submitted successfully.",
        review,
        summary
      },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unable to submit review." },
      { status: 500 }
    );
  }
}
