"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CommerceAddress, CommerceProfile } from "@/lib/commerce";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function AccountClient({
  initialProfile,
  initialAddresses
}: {
  initialProfile: CommerceProfile;
  initialAddresses: CommerceAddress[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [profile, setProfile] = useState(initialProfile);
  const [addresses, setAddresses] = useState(initialAddresses);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [addressForm, setAddressForm] = useState({
    id: "",
    label: "",
    fullName: initialProfile.fullName,
    phone: initialProfile.phone,
    line1: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India"
  });

  function notify(tone: "success" | "error", nextMessage: string) {
    setMessageTone(tone);
    setMessage(nextMessage);
    window.setTimeout(() => setMessage(""), 2600);
  }

  async function saveProfile() {
    setBusy("profile");
    const response = await fetch("/api/account/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: profile.fullName,
        phone: profile.phone
      })
    });
    const result = (await response.json()) as { profile?: CommerceProfile; message?: string };
    if (!response.ok || !result.profile) {
      notify("error", result.message || "Unable to save profile.");
      setBusy("");
      return;
    }

    const savedProfile = result.profile;
    setProfile(savedProfile);
    setAddressForm((current) => ({
      ...current,
      fullName: current.fullName || savedProfile.fullName,
      phone: current.phone || savedProfile.phone
    }));
    notify("success", result.message || "Profile updated.");
    setBusy("");
    router.refresh();
  }

  async function saveAddress() {
    setBusy("address");
    const response = await fetch("/api/account/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addressForm)
    });
    const result = (await response.json()) as { addresses?: CommerceAddress[]; message?: string };
    if (!response.ok || !result.addresses) {
      notify("error", result.message || "Unable to save address.");
      setBusy("");
      return;
    }

    setAddresses(result.addresses);
    setAddressForm({
      id: "",
      label: "",
      fullName: profile.fullName,
      phone: profile.phone,
      line1: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India"
    });
    notify("success", result.message || "Address saved.");
    setBusy("");
    router.refresh();
  }

  async function removeAddress(id: string) {
    setBusy(`delete-${id}`);
    const response = await fetch("/api/account/addresses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    const result = (await response.json()) as { addresses?: CommerceAddress[]; message?: string };
    if (!response.ok || !result.addresses) {
      notify("error", result.message || "Unable to remove address.");
      setBusy("");
      return;
    }

    setAddresses(result.addresses);
    notify("success", result.message || "Address removed.");
    setBusy("");
    router.refresh();
  }

  function editAddress(address: CommerceAddress) {
    setAddressForm({
      id: address.id,
      label: address.label,
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country
    });
  }

  async function handleSignOut() {
    setBusy("signout");
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="account-detail-grid">
      {message ? <p className={`form-status form-status-${messageTone}`}>{message}</p> : null}

      <article className="commerce-panel">
        <div className="commerce-panel-heading">
          <div>
            <p className="admin-kicker">Profile</p>
            <h2>Personal details</h2>
          </div>
          <button className="button button-secondary button-small" type="button" disabled={busy === "signout"} onClick={handleSignOut}>
            {busy === "signout" ? "Signing out..." : "Sign Out"}
          </button>
        </div>

        <div className="admin-form-grid admin-form-grid-compact">
          <input value={profile.fullName} placeholder="Full name" onChange={(event) => setProfile((current) => ({ ...current, fullName: event.target.value }))} />
          <input value={profile.email} disabled placeholder="Email" />
          <input value={profile.phone} placeholder="Phone number" onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))} />
        </div>
        <div className="admin-actions">
          <button className="button button-small" type="button" disabled={busy === "profile"} onClick={saveProfile}>
            {busy === "profile" ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </article>

      <article className="commerce-panel">
        <div className="commerce-panel-heading">
          <div>
            <p className="admin-kicker">Addresses</p>
            <h2>Saved delivery addresses</h2>
          </div>
        </div>

        <div className="admin-form-grid">
          <input placeholder="Label" value={addressForm.label} onChange={(event) => setAddressForm((current) => ({ ...current, label: event.target.value }))} />
          <input placeholder="Full name" value={addressForm.fullName} onChange={(event) => setAddressForm((current) => ({ ...current, fullName: event.target.value }))} />
          <input placeholder="Phone" value={addressForm.phone} onChange={(event) => setAddressForm((current) => ({ ...current, phone: event.target.value }))} />
          <input placeholder="Address line" value={addressForm.line1} onChange={(event) => setAddressForm((current) => ({ ...current, line1: event.target.value }))} />
          <input placeholder="City" value={addressForm.city} onChange={(event) => setAddressForm((current) => ({ ...current, city: event.target.value }))} />
          <input placeholder="State" value={addressForm.state} onChange={(event) => setAddressForm((current) => ({ ...current, state: event.target.value }))} />
          <input placeholder="Postal code" value={addressForm.postalCode} onChange={(event) => setAddressForm((current) => ({ ...current, postalCode: event.target.value }))} />
          <input placeholder="Country" value={addressForm.country} onChange={(event) => setAddressForm((current) => ({ ...current, country: event.target.value }))} />
        </div>
        <div className="admin-actions">
          <button className="button button-small" type="button" disabled={busy === "address"} onClick={saveAddress}>
            {busy === "address" ? "Saving..." : addressForm.id ? "Update Address" : "Add Address"}
          </button>
          <button
            className="button button-secondary button-small"
            type="button"
            onClick={() =>
              setAddressForm({
                id: "",
                label: "",
                fullName: profile.fullName,
                phone: profile.phone,
                line1: "",
                city: "",
                state: "",
                postalCode: "",
                country: "India"
              })
            }
          >
            Reset
          </button>
        </div>

        <div className="commerce-list">
          {addresses.length ? (
            addresses.map((address) => (
              <div className="commerce-list-item" key={address.id}>
                <div>
                  <strong>{address.label || address.fullName}</strong>
                  <p>
                    {address.line1}, {address.city}, {address.state} {address.postalCode}
                  </p>
                </div>
                <div className="commerce-list-side">
                  <button className="button button-secondary button-small" type="button" onClick={() => editAddress(address)}>
                    Edit
                  </button>
                  <button
                    className="button button-secondary button-small"
                    type="button"
                    disabled={busy === `delete-${address.id}`}
                    onClick={() => void removeAddress(address.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="admin-copy">No saved addresses yet.</p>
          )}
        </div>
      </article>
    </div>
  );
}
