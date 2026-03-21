import { sendSubmissionNotification } from "@/lib/notifications";
import { saveSubmission } from "@/lib/submissions";

type JoinPayload = {
  name?: string;
  phone?: string;
  email?: string;
  bloodGroup?: string;
  condition?: string;
  batchType?: string;
  goal?: string;
  notes?: string;
};

export async function POST(request: Request) {
  let payload: JoinPayload;

  try {
    payload = (await request.json()) as JoinPayload;
  } catch {
    return Response.json({ message: "Invalid request payload." }, { status: 400 });
  }

  if (!payload.name || !payload.phone || !payload.email || !payload.bloodGroup || !payload.condition || !payload.batchType || !payload.goal) {
    return Response.json({ message: "Please fill in the required details so we can place you properly." }, { status: 400 });
  }

  const entry = {
    id: crypto.randomUUID(),
    name: payload.name.trim(),
    phone: payload.phone.trim(),
    email: payload.email.trim(),
    bloodGroup: payload.bloodGroup.trim(),
    condition: payload.condition.trim(),
    batchType: payload.batchType.trim(),
    goal: payload.goal.trim(),
    notes: payload.notes?.trim() || "",
    createdAt: new Date().toISOString()
  };

  let storage: "supabase" | "local";
  try {
    storage = await saveSubmission(entry);
  } catch (error) {
    return Response.json(
      {
        message: "We could not save your details right now. Please try again in a moment.",
        error: error instanceof Error ? error.message : "Unknown storage error"
      },
      { status: 500 }
    );
  }

  let notificationSent = false;
  try {
    notificationSent = await sendSubmissionNotification(entry);
  } catch {
    notificationSent = false;
  }

  return Response.json(
    {
      message: "Your details have been saved.",
      storage,
      notificationSent
    },
    { status: 201 }
  );
}
