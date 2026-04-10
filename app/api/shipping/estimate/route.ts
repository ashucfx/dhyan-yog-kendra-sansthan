import { getCommerceShippingEstimate } from "@/lib/commerce-shipping";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      postalCode?: string;
      subtotal?: number;
      country?: string;
    };

    const postalCode = payload.postalCode?.trim() ?? "";
    const subtotal = Number(payload.subtotal ?? 0);
    const country = payload.country?.trim() || "India";

    if (country.toLowerCase() !== "india") {
      return Response.json(
        {
          valid: false,
          serviceable: false,
          message: "This checkout currently supports delivery within India only."
        },
        { status: 400 }
      );
    }

    const estimate = await getCommerceShippingEstimate({
      postalCode,
      subtotal
    });

    if (!estimate.valid || !estimate.serviceable) {
      return Response.json(estimate, { status: 400 });
    }

    return Response.json(estimate, { status: 200 });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unable to estimate shipping." },
      { status: 500 }
    );
  }
}
