import { assertRateLimit } from "@/lib/rate-limit";
import { getAuthenticatedUser } from "@/lib/auth-user";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

const imageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const videoMimeTypes = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const imageMaxBytes = 6 * 1024 * 1024;
const videoMaxBytes = 25 * 1024 * 1024;
const extensionByMimeType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov"
};

export async function POST(request: Request) {
  try {
    assertRateLimit(request, { key: "review-media", limit: 10, windowMs: 60_000 });

    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ message: "Please sign in before uploading review media." }, { status: 401 });
    }

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return Response.json({ message: "Review media uploads are not configured." }, { status: 500 });
    }

    const formData = await request.formData();
    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0)
      .slice(0, 4);

    if (!files.length) {
      return Response.json({ message: "Select at least one image or video." }, { status: 400 });
    }

    const uploadedMedia: Array<{ kind: "image" | "video"; url: string }> = [];
    const bucket = process.env.SUPABASE_REVIEW_MEDIA_BUCKET?.trim() || "review-media";

    for (const file of files) {
      const isImage = imageMimeTypes.has(file.type);
      const isVideo = videoMimeTypes.has(file.type);
      if (!isImage && !isVideo) {
        return Response.json({ message: "Only JPG, PNG, WebP, AVIF, MP4, WebM, and MOV files are supported." }, { status: 400 });
      }

      const maxBytes = isVideo ? videoMaxBytes : imageMaxBytes;
      if (file.size > maxBytes) {
        return Response.json(
          { message: isVideo ? "Videos must be 25 MB or smaller." : "Images must be 6 MB or smaller." },
          { status: 400 }
        );
      }

      const extension = extensionByMimeType[file.type] ?? "bin";
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
      const filePath = `${user.id}/${fileName}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error } = await supabase.storage.from(bucket).upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      });
      if (error) {
        throw new Error(error.message);
      }

      const {
        data: { publicUrl }
      } = supabase.storage.from(bucket).getPublicUrl(filePath);

      uploadedMedia.push({
        kind: isVideo ? "video" : "image",
        url: publicUrl
      });
    }

    return Response.json(
      {
        message: "Review media uploaded successfully.",
        media: uploadedMedia
      },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unable to upload review media." },
      { status: 500 }
    );
  }
}
