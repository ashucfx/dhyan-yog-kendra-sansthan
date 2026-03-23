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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}

function isValidIndianPhone(phone: string) {
  const normalized = normalizePhone(phone);

  if (/^\d{10}$/.test(normalized)) {
    return true;
  }

  if (/^91\d{10}$/.test(normalized)) {
    return true;
  }

  if (/^\+91\d{10}$/.test(normalized)) {
    return true;
  }

  return false;
}

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

  const cleanedName = payload.name.trim().replace(/\s+/g, " ");
  const cleanedPhone = payload.phone.trim();
  const cleanedEmail = payload.email.trim().toLowerCase();
  const cleanedBloodGroup = payload.bloodGroup.trim();
  const cleanedCondition = payload.condition.trim();
  const cleanedBatchType = payload.batchType.trim();
  const cleanedGoal = payload.goal.trim();
  const cleanedNotes = payload.notes?.trim() || "";

  if (cleanedName.length < 2 || cleanedName.length > 80) {
    return Response.json({ message: "Please enter a valid full name." }, { status: 400 });
  }

  if (!emailRegex.test(cleanedEmail)) {
    return Response.json({ message: "Please enter a valid email address." }, { status: 400 });
  }

  if (!isValidIndianPhone(cleanedPhone)) {
    return Response.json({ message: "Please enter a valid 10-digit mobile number." }, { status: 400 });
  }

  if (cleanedNotes.length > 800) {
    return Response.json({ message: "Notes are too long. Please keep them within 800 characters." }, { status: 400 });
  }

  const entry = {
    id: crypto.randomUUID(),
    name: cleanedName,
    phone: cleanedPhone,
    email: cleanedEmail,
    bloodGroup: cleanedBloodGroup,
    condition: cleanedCondition,
    batchType: cleanedBatchType,
    goal: cleanedGoal,
    notes: cleanedNotes,
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

  const notification = await sendSubmissionNotification(entry);
  if (!notification.sent) {
    console.error("Join notification failed:", notification.reason);
  }

  return Response.json(
    {
      message: "Your details have been saved.",
      storage,
      notificationSent: notification.sent,
      notificationReason: notification.sent ? undefined : notification.reason
    },
    { status: 201 }
  );
}
