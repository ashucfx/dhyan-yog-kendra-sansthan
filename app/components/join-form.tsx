"use client";

import { useState } from "react";

type JoinFormProps = {
  conditions: string[];
};

type FormState = {
  name: string;
  phone: string;
  email: string;
  bloodGroup: string;
  condition: string;
  batchType: string;
  goal: string;
  notes: string;
};

const initialState: FormState = {
  name: "",
  phone: "",
  email: "",
  bloodGroup: "",
  condition: "",
  batchType: "",
  goal: "",
  notes: ""
};

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const batchTypes = ["Condition-specific batch", "Common wellness batch", "Merged support batch"];
const goals = [
  "Balance hormones",
  "Reduce stress",
  "Sleep better",
  "Improve flexibility",
  "Support pregnancy wellness",
  "Build a daily routine"
];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidIndianPhone(phone: string) {
  const normalized = phone.replace(/[^\d+]/g, "");
  return /^\d{10}$/.test(normalized) || /^91\d{10}$/.test(normalized) || /^\+91\d{10}$/.test(normalized);
}

export function JoinForm({ conditions }: JoinFormProps) {
  const [form, setForm] = useState<FormState>(initialState);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const cleanName = form.name.trim().replace(/\s+/g, " ");
    const cleanEmail = form.email.trim().toLowerCase();
    const cleanPhone = form.phone.trim();

    if (cleanName.length < 2 || cleanName.length > 80) {
      setStatus("error");
      setMessage("Please enter a valid full name.");
      return;
    }

    if (!emailRegex.test(cleanEmail)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    if (!isValidIndianPhone(cleanPhone)) {
      setStatus("error");
      setMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (form.notes.length > 800) {
      setStatus("error");
      setMessage("Notes are too long. Please keep them within 800 characters.");
      return;
    }

    try {
      const response = await fetch("/api/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...form,
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone
        })
      });

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(result.message || "Something went wrong while saving your details.");
      }

      setStatus("success");
      setMessage("You are in. We saved your details and can now place you into the right batch.");
      setForm(initialState);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to save your details right now.");
    }
  }

  return (
    <form className="signup-form" onSubmit={handleSubmit}>
      <label htmlFor="name">
        Your name
        <input
          id="name"
          type="text"
          placeholder="Enter your name"
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          minLength={2}
          maxLength={80}
          required
        />
      </label>

      <label htmlFor="phone">
        Mobile number
        <input
          id="phone"
          type="tel"
          placeholder="+91 98765 43210"
          value={form.phone}
          onChange={(event) => updateField("phone", event.target.value)}
          inputMode="tel"
          maxLength={16}
          pattern="^(\+91|91)?[6-9]\d{9}$"
          required
        />
      </label>

      <label htmlFor="email">
        Email address
        <input
          id="email"
          type="email"
          placeholder="dhyanvedaglobal@gmail.com"
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
          maxLength={120}
          required
        />
      </label>

      <label htmlFor="blood-group">
        Blood group
        <select id="blood-group" value={form.bloodGroup} onChange={(event) => updateField("bloodGroup", event.target.value)} required>
          <option value="" disabled>
            Select blood group
          </option>
          {bloodGroups.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
      </label>

      <label htmlFor="condition">
        Health condition
        <select id="condition" value={form.condition} onChange={(event) => updateField("condition", event.target.value)} required>
          <option value="" disabled>
            Select health condition
          </option>
          {conditions.map((condition) => (
            <option key={condition} value={condition}>
              {condition}
            </option>
          ))}
        </select>
      </label>

      <label htmlFor="batch-type">
        Preferred batch type
        <select id="batch-type" value={form.batchType} onChange={(event) => updateField("batchType", event.target.value)} required>
          <option value="" disabled>
            Select batch type
          </option>
          {batchTypes.map((batch) => (
            <option key={batch} value={batch}>
              {batch}
            </option>
          ))}
        </select>
      </label>

      <label htmlFor="goal">
        Your main goal
        <select id="goal" value={form.goal} onChange={(event) => updateField("goal", event.target.value)} required>
          <option value="" disabled>
            Select your goal
          </option>
          {goals.map((goal) => (
            <option key={goal} value={goal}>
              {goal}
            </option>
          ))}
        </select>
      </label>

      <label htmlFor="notes">
        Tell us anything important
        <textarea
          id="notes"
          rows={4}
          placeholder="Share your symptoms, schedule preference, or anything you want us to know."
          value={form.notes}
          onChange={(event) => updateField("notes", event.target.value)}
          maxLength={800}
        />
      </label>

      <button className="button" type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Saving your details..." : "Start My Wellness Journey Today"}
      </button>

      <p className="microcopy">
        We use your blood group, condition, and goal to guide batch placement and your first diet chart direction.
      </p>

      {message ? <p className={`form-status form-status-${status}`}>{message}</p> : null}
    </form>
  );
}
