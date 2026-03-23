import { sendSubmissionNotification } from "@/lib/notifications";
import { formatE164, getCountryRuleByIso, isValidPhoneForRule, normalizePhoneDigits } from "@/lib/country-phone";
import { saveSubmission } from "@/lib/submissions";

type JoinPayload = {
  name?: string;
  countryIso?: string;
  countryCode?: string;
  phone?: string;
  fullPhone?: string;
  email?: string;
  bloodGroup?: string;
  condition?: string;
  batchType?: string;
  goal?: string;
  notes?: string;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function sanitizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function sanitizeText(text: string | undefined) {
  return text?.trim() || "";
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

  const cleanedName = sanitizeName(payload.name);
  const cleanedEmail = sanitizeEmail(payload.email);
  const cleanedCountryIso = (payload.countryIso || "").trim().toUpperCase();
  const cleanedPhoneDigits = normalizePhoneDigits(payload.phone);
  const cleanedBloodGroup = sanitizeText(payload.bloodGroup);
  const cleanedCondition = sanitizeText(payload.condition);
  const cleanedBatchType = sanitizeText(payload.batchType);
  const cleanedGoal = sanitizeText(payload.goal);
  const cleanedNotes = sanitizeText(payload.notes);
  const countryRule = getCountryRuleByIso(cleanedCountryIso);

  if (cleanedName.length < 2 || cleanedName.length > 80) {
    return Response.json({ message: "Please enter a valid full name." }, { status: 400 });
  }

  if (!emailRegex.test(cleanedEmail)) {
    return Response.json({ message: "Please enter a valid email address." }, { status: 400 });
  }

  if (!countryRule) {
    return Response.json({ message: "Please select a valid country." }, { status: 400 });
  }

  if (!isValidPhoneForRule(countryRule, cleanedPhoneDigits)) {
    return Response.json({ message: `Please enter a valid ${countryRule.country} mobile number.` }, { status: 400 });
  }

  if (cleanedNotes.length > 800) {
    return Response.json({ message: "Notes are too long. Please keep them within 800 characters." }, { status: 400 });
  }

  const fullPhone = formatE164(countryRule, cleanedPhoneDigits);

  if (payload.countryCode && payload.countryCode !== countryRule.dialCode) {
    return Response.json({ message: "Country code does not match the selected country." }, { status: 400 });
  }

  if (payload.fullPhone && payload.fullPhone !== fullPhone) {
    return Response.json({ message: "Phone number does not match the selected country." }, { status: 400 });
  }

  const entry = {
    id: crypto.randomUUID(),
    name: cleanedName,
    countryIso: countryRule.iso,
    country: countryRule.country,
    countryCode: countryRule.dialCode,
    phone: fullPhone,
    phoneNational: cleanedPhoneDigits,
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
