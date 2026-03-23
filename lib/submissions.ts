import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

export type SubmissionRecord = {
  id: string;
  name: string;
  countryIso: string;
  country: string;
  countryCode: string;
  phone: string;
  phoneNational: string;
  email: string;
  bloodGroup: string;
  condition: string;
  batchType: string;
  goal: string;
  notes: string;
  createdAt: string;
};

const dataDirectory = join(process.cwd(), "data");
const dataFile = join(dataDirectory, "join-submissions.json");

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function readLocalSubmissions() {
  try {
    const content = await readFile(dataFile, "utf8");
    const entries = JSON.parse(content) as Partial<SubmissionRecord>[];
    return entries.map((entry) => ({
      id: entry.id ?? crypto.randomUUID(),
      name: entry.name ?? "",
      countryIso: entry.countryIso ?? "IN",
      country: entry.country ?? "India",
      countryCode: entry.countryCode ?? "+91",
      phone: entry.phone ?? "",
      phoneNational: entry.phoneNational ?? entry.phone ?? "",
      email: entry.email ?? "",
      bloodGroup: entry.bloodGroup ?? "",
      condition: entry.condition ?? "",
      batchType: entry.batchType ?? "",
      goal: entry.goal ?? "",
      notes: entry.notes ?? "",
      createdAt: entry.createdAt ?? new Date(0).toISOString()
    })) satisfies SubmissionRecord[];
  } catch {
    return [];
  }
}

export async function writeLocalSubmission(entry: SubmissionRecord) {
  await mkdir(dataDirectory, { recursive: true });
  const entries = await readLocalSubmissions();
  entries.push(entry);
  await writeFile(dataFile, JSON.stringify(entries, null, 2), "utf8");
}

export async function saveSubmission(entry: SubmissionRecord) {
  const supabase = getSupabaseClient();

  if (supabase) {
    const { error } = await supabase.from("submissions").insert({
      id: entry.id,
      name: entry.name,
      country_iso: entry.countryIso,
      country_name: entry.country,
      country_code: entry.countryCode,
      phone: entry.phone,
      phone_national: entry.phoneNational,
      email: entry.email,
      blood_group: entry.bloodGroup,
      condition: entry.condition,
      batch_type: entry.batchType,
      goal: entry.goal,
      notes: entry.notes,
      created_at: entry.createdAt
    });

    if (error) {
      throw new Error(error.message);
    }

    return "supabase";
  }

  await writeLocalSubmission(entry);
  return "local";
}

export async function listSubmissions() {
  const supabase = getSupabaseClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("submissions")
      .select("id, name, country_iso, country_name, country_code, phone, phone_national, email, blood_group, condition, batch_type, goal, notes, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data.map((item) => ({
      id: item.id,
      name: item.name,
      countryIso: item.country_iso,
      country: item.country_name,
      countryCode: item.country_code,
      phone: item.phone,
      phoneNational: item.phone_national ?? item.phone,
      email: item.email,
      bloodGroup: item.blood_group,
      condition: item.condition,
      batchType: item.batch_type,
      goal: item.goal,
      notes: item.notes ?? "",
      createdAt: item.created_at
    })) satisfies SubmissionRecord[];
  }

  const localEntries = await readLocalSubmissions();
  return [...localEntries].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function getStorageLabel() {
  return getSupabaseClient() ? "Supabase" : "Local JSON fallback";
}
