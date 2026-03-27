import { getAuthenticatedUser } from "@/lib/auth-user";
import { deleteAddress, listAddressesForUser, saveAddress } from "@/lib/commerce";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return Response.json({ message: "Please sign in to access your addresses." }, { status: 401 });
  }

  const addresses = await listAddressesForUser(user.id);
  return Response.json({ addresses }, { status: 200 });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return Response.json({ message: "Please sign in to manage addresses." }, { status: 401 });
  }

  const payload = (await request.json()) as {
    id?: string;
    label?: string;
    fullName?: string;
    phone?: string;
    line1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };

  if (!payload.fullName || !payload.phone || !payload.line1 || !payload.city || !payload.state || !payload.postalCode) {
    return Response.json({ message: "All address fields are required." }, { status: 400 });
  }

  const address = await saveAddress({
    id: payload.id,
    userId: user.id,
    label: payload.label ?? "",
    fullName: payload.fullName,
    phone: payload.phone,
    line1: payload.line1,
    city: payload.city,
    state: payload.state,
    postalCode: payload.postalCode,
    country: payload.country ?? "India"
  });

  const addresses = await listAddressesForUser(user.id);
  return Response.json({ message: "Address saved successfully.", address, addresses }, { status: 200 });
}

export async function DELETE(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return Response.json({ message: "Please sign in to manage addresses." }, { status: 401 });
  }

  const { id } = (await request.json()) as { id?: string };
  if (!id) {
    return Response.json({ message: "Address id is required." }, { status: 400 });
  }

  await deleteAddress(id, user.id);
  const addresses = await listAddressesForUser(user.id);
  return Response.json({ message: "Address removed successfully.", addresses }, { status: 200 });
}
