import { assertAdminUser } from "@/lib/admin-rbac";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

function getSupabaseService() {
  return getSupabaseServiceClient();
}

const maxUploadSizeBytes = 5 * 1024 * 1024;
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const extensionByMimeType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif"
};

export async function POST(request: Request) {
  try {
    await assertAdminUser();
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : "Unauthorized." }, { status: 401 });
  }

  const supabase = getSupabaseService();
  if (!supabase) {
    return Response.json({ message: "Supabase service not configured." }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return Response.json({ message: "No file provided." }, { status: 400 });
    }

    if (!allowedMimeTypes.has(file.type)) {
      return Response.json({ message: "Upload a JPG, PNG, WebP, or AVIF image." }, { status: 400 });
    }

    if (file.size <= 0 || file.size > maxUploadSizeBytes) {
      return Response.json({ message: "Image size must be between 1 byte and 5 MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExt = extensionByMimeType[file.type] ?? "bin";
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error } = await supabase.storage
      .from("products")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("products")
      .getPublicUrl(filePath);

    return Response.json({
      message: "File uploaded successfully.",
      url: publicUrl
    }, { status: 200 });
  } catch (error) {
    return Response.json({
      message: error instanceof Error ? error.message : "Upload failed."
    }, { status: 500 });
  }
}
