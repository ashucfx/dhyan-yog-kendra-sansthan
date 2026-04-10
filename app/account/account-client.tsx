"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CommerceAddress, CommerceProfile } from "@/lib/commerce";
import { isValidIndianPostalCode } from "@/lib/commerce-pricing";
import { validateEmail, validateIndianMobile } from "@/lib/customer-validation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type ProfileErrors = {
  fullName?: string;
  email?: string;
  phone?: string;
};

type AddressErrors = {
  fullName?: string;
  phone?: string;
  line1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

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
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});
  const [addressErrors, setAddressErrors] = useState<AddressErrors>({});
  const [addressForm, setAddressForm] = useState({
    id: "",
    label: "",
    fullName: initialProfile.fullName,
    phone: initialProfile.phone,
    line1: "",
    landmark: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India"
  });

  function notify(tone: "success" | "error", nextMessage: string) {
    setMessageTone(tone);
    setMessage(nextMessage);
    window.setTimeout(() => setMessage(""), 3200);
  }

  function resetAddressForm() {
    setAddressForm({
      id: "",
      label: "",
      fullName: profile.fullName,
      phone: profile.phone,
      line1: "",
      landmark: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India"
    });
    setAddressErrors({});
  }

  function validateProfileForm() {
    const nextErrors: ProfileErrors = {};

    if (!profile.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }
    if (!validateEmail(profile.email)) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!validateIndianMobile(profile.phone)) {
      nextErrors.phone = "Enter a valid 10-digit Indian mobile number.";
    }

    setProfileErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function validateAddressForm() {
    const nextErrors: AddressErrors = {};

    if (!addressForm.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }
    if (!validateIndianMobile(addressForm.phone)) {
      nextErrors.phone = "Enter a valid 10-digit Indian mobile number.";
    }
    if (!addressForm.line1.trim()) {
      nextErrors.line1 = "Address line is required.";
    }
    if (!addressForm.city.trim()) {
      nextErrors.city = "City is required.";
    }
    if (!addressForm.state.trim()) {
      nextErrors.state = "State is required.";
    }
    if (!isValidIndianPostalCode(addressForm.postalCode)) {
      nextErrors.postalCode = "Enter a valid 6-digit Indian pincode.";
    }
    if (addressForm.country.trim().toLowerCase() !== "india") {
      nextErrors.country = "Only India is supported right now.";
    }

    setAddressErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function saveProfile() {
    if (!validateProfileForm()) {
      notify("error", "Correct the highlighted profile fields.");
      return;
    }

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
    setProfileErrors({});
    notify("success", result.message || "Profile updated.");
    setBusy("");
    router.refresh();
  }

  async function saveAddress() {
    if (!validateAddressForm()) {
      notify("error", "Correct the highlighted address fields.");
      return;
    }

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
    resetAddressForm();
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
      landmark: address.landmark ?? "",
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country
    });
    setAddressErrors({});
  }

  async function handleSignOut() {
    setBusy("signout");
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="account-layout">
      {message ? <p className={`form-status form-status-${messageTone}`}>{message}</p> : null}

      <article className="account-card">
        <div className="account-card-head">
          <div>
            <p className="eyebrow">Profile</p>
            <h2>Personal details</h2>
            <p className="account-section-copy">Keep your contact details current so order updates and checkout stay frictionless.</p>
          </div>
          <button className="button button-secondary button-small account-card-head-action" type="button" disabled={busy === "signout"} onClick={handleSignOut}>
            {busy === "signout" ? "Signing out..." : "Sign Out"}
          </button>
        </div>

        <div className="account-form-grid account-form-grid-profile">
          <label className="account-field">
            <span className="account-field-label">Full name</span>
            <input value={profile.fullName} placeholder="Full name" onChange={(event) => setProfile((current) => ({ ...current, fullName: event.target.value }))} />
            {profileErrors.fullName ? <p className="account-field-error">{profileErrors.fullName}</p> : null}
          </label>
          <label className="account-field">
            <span className="account-field-label">Mobile number</span>
            <input value={profile.phone} placeholder="Phone number" onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))} />
            {profileErrors.phone ? <p className="account-field-error">{profileErrors.phone}</p> : null}
          </label>
          <label className="account-field account-field-span-2">
            <span className="account-field-label">Email address</span>
            <input value={profile.email} disabled placeholder="Email" />
            <p className="account-field-hint">Used for sign-in, confirmations, and order updates.</p>
            {profileErrors.email ? <p className="account-field-error">{profileErrors.email}</p> : null}
          </label>
        </div>
        <div className="account-actions">
          <button className="button button-small" type="button" disabled={busy === "profile"} onClick={saveProfile}>
            {busy === "profile" ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </article>

      <article className="account-card">
        <div className="account-card-head">
          <div>
            <p className="eyebrow">Addresses</p>
            <h2>Saved delivery addresses</h2>
            <p className="account-section-copy">Save a complete delivery profile once and reuse it during checkout.</p>
          </div>
        </div>

        <div className="account-form-grid account-form-grid-address">
          <label className="account-field">
            <span className="account-field-label">Address label</span>
            <input placeholder="Label" value={addressForm.label} onChange={(event) => setAddressForm((current) => ({ ...current, label: event.target.value }))} />
          </label>
          <label className="account-field">
            <span className="account-field-label">Full name</span>
            <input placeholder="Full name" value={addressForm.fullName} onChange={(event) => setAddressForm((current) => ({ ...current, fullName: event.target.value }))} />
            {addressErrors.fullName ? <p className="account-field-error">{addressErrors.fullName}</p> : null}
          </label>
          <label className="account-field">
            <span className="account-field-label">Phone number</span>
            <input placeholder="Phone" value={addressForm.phone} onChange={(event) => setAddressForm((current) => ({ ...current, phone: event.target.value }))} />
            {addressErrors.phone ? <p className="account-field-error">{addressErrors.phone}</p> : null}
          </label>
          <label className="account-field account-field-span-2">
            <span className="account-field-label">Address line</span>
            <input placeholder="Address line" value={addressForm.line1} onChange={(event) => setAddressForm((current) => ({ ...current, line1: event.target.value }))} />
            {addressErrors.line1 ? <p className="account-field-error">{addressErrors.line1}</p> : null}
          </label>
          <label className="account-field">
            <span className="account-field-label">Landmark</span>
            <input placeholder="Landmark (optional)" value={addressForm.landmark} onChange={(event) => setAddressForm((current) => ({ ...current, landmark: event.target.value }))} />
          </label>
          <label className="account-field">
            <span className="account-field-label">City</span>
            <input placeholder="City" value={addressForm.city} onChange={(event) => setAddressForm((current) => ({ ...current, city: event.target.value }))} />
            {addressErrors.city ? <p className="account-field-error">{addressErrors.city}</p> : null}
          </label>
          <label className="account-field">
            <span className="account-field-label">State</span>
            <input placeholder="State" value={addressForm.state} onChange={(event) => setAddressForm((current) => ({ ...current, state: event.target.value }))} />
            {addressErrors.state ? <p className="account-field-error">{addressErrors.state}</p> : null}
          </label>
          <label className="account-field">
            <span className="account-field-label">Postal code</span>
            <input
              placeholder="Postal code"
              value={addressForm.postalCode}
              onChange={(event) =>
                setAddressForm((current) => ({ ...current, postalCode: event.target.value.replace(/\D/g, "").slice(0, 6) }))
              }
            />
            {addressErrors.postalCode ? <p className="account-field-error">{addressErrors.postalCode}</p> : null}
          </label>
          <label className="account-field">
            <span className="account-field-label">Country</span>
            <input placeholder="Country" value={addressForm.country} onChange={(event) => setAddressForm((current) => ({ ...current, country: event.target.value }))} />
            {addressErrors.country ? <p className="account-field-error">{addressErrors.country}</p> : null}
          </label>
        </div>
        <div className="account-actions">
          <button className="button button-small" type="button" disabled={busy === "address"} onClick={saveAddress}>
            {busy === "address" ? "Saving..." : addressForm.id ? "Update Address" : "Add Address"}
          </button>
          <button className="button button-secondary button-small" type="button" onClick={resetAddressForm}>
            Reset
          </button>
        </div>

        <div className="account-address-list">
          {addresses.length ? (
            addresses.map((address) => (
              <article className="account-address-card" key={address.id}>
                <div className="account-address-copy">
                  <strong>{address.label || address.fullName}</strong>
                  <p className="account-address-line">
                    {address.line1}, {address.city}, {address.state} {address.postalCode}
                  </p>
                  {address.landmark ? <p className="account-address-line">Landmark: {address.landmark}</p> : null}
                  <p className="account-address-line">{address.phone}</p>
                </div>
                <div className="account-address-actions">
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
              </article>
            ))
          ) : (
            <p className="account-empty-copy">No saved addresses yet.</p>
          )}
        </div>
      </article>
    </div>
  );
}
