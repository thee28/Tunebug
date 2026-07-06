"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

const C = {
  primary: "#574eb1", primaryDark: "#41379b", primaryDim: "#c5c0ff",
  surface: "var(--c-surface-alt)", surfaceHigh: "var(--c-surface-high)",
  border: "var(--c-border)", muted: "var(--c-muted)", text: "var(--c-text)",
  accent: "#574eb1",
  danger: "#ef4444",
};

const INPUT = {
  width: "100%", padding: "13px 16px", borderRadius: 12,
  backgroundColor: C.surfaceHigh, border: `2px solid ${C.border}`,
  color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 15,
  outline: "none", boxSizing: "border-box" as const,
};

const LABEL = {
  color: C.text, fontFamily: "'Nunito', sans-serif",
  fontSize: 14, fontWeight: 700, marginBottom: 8, display: "block" as const,
};

export interface PrivacySettings {
  publicProfile: boolean;
  personalizedRecs: boolean;
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      style={{
        width: 50, height: 28, borderRadius: 14, flexShrink: 0,
        backgroundColor: on ? C.accent : C.border,
        position: "relative", cursor: "pointer",
        transition: "background-color 0.2s",
      }}
    >
      <div style={{
        position: "absolute", top: 3, left: on ? 23 : 3,
        width: 22, height: 22, borderRadius: "50%",
        backgroundColor: "white", transition: "left 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: on ? "#c5c0ff" : "#bbb" }} />
      </div>
    </div>
  );
}

function SectionHeader({ title, right }: { title: string; right?: string }) {
  return (
    <div style={{ marginBottom: 4, marginTop: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 18, fontWeight: 800, margin: 0 }}>
          {title}
        </h2>
        {right && (
          <span style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 600 }}>
            {right}
          </span>
        )}
      </div>
      <div style={{ height: 1, backgroundColor: C.border }} />
    </div>
  );
}

function ToggleRow({ label, description, on, onToggle }: { label: string; description?: string; on: boolean; onToggle: () => void }) {
  return (
    <div style={{
      display: "flex", alignItems: description ? "flex-start" : "center",
      justifyContent: "space-between", gap: 20,
      padding: "17px 0", borderBottom: `1px solid ${C.border}`,
    }}>
      <div>
        <p style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 600, margin: 0 }}>
          {label}
        </p>
        {description && (
          <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 13, margin: "4px 0 0" }}>
            {description}
          </p>
        )}
      </div>
      <Toggle on={on} onToggle={onToggle} />
    </div>
  );
}

function SaveButton({ disabled, saving, onClick }: { disabled?: boolean; saving?: boolean; onClick: () => void }) {
  const inactive = disabled || saving;
  return (
    <button
      disabled={inactive}
      onClick={onClick}
      style={{
        padding: "12px 28px", borderRadius: 12, border: "none",
        backgroundColor: inactive ? "rgba(255,255,255,0.08)" : C.primary,
        boxShadow: inactive ? "none" : `0 4px 0 0 ${C.primaryDark}`,
        color: inactive ? C.muted : "white",
        fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 800,
        letterSpacing: "0.06em", textTransform: "uppercase", cursor: inactive ? "default" : "pointer",
        transition: "background-color 0.15s",
      }}
    >
      {saving ? "Saving…" : "Save Changes"}
    </button>
  );
}

function StatusMessage({ status }: { status: { kind: "success" | "error"; text: string } | null }) {
  if (!status) return null;
  return (
    <p style={{
      color: status.kind === "success" ? "#83f5c6" : "#ffb4ab",
      fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700,
      margin: "12px 0 0",
    }}>
      {status.text}
    </p>
  );
}

type Status = { kind: "success" | "error"; text: string } | null;

// ── Sub-views ──────────────────────────────────────────────────────────────

function readPref(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  const stored = localStorage.getItem(key);
  return stored === null ? fallback : stored !== "false";
}

function Preferences() {
  const [soundEffects, setSoundEffects] = useState(() => readPref("pref_soundEffects", true));
  const [motivational, setMotivational] = useState(() => readPref("pref_motivational", true));

  function togglePref(key: string, value: boolean, setter: (v: boolean) => void) {
    setter(value);
    localStorage.setItem(key, String(value));
  }

  return (
    <div>
      <h1 style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 24, fontWeight: 900, margin: "0 0 28px" }}>
        Preferences
      </h1>

      <div style={{ marginBottom: 28 }}>
        <SectionHeader title="Lesson experience" />
        <ToggleRow
          label="Sound effects"
          on={soundEffects}
          onToggle={() => togglePref("pref_soundEffects", !soundEffects, setSoundEffects)}
        />
        <ToggleRow
          label="Motivational messages"
          on={motivational}
          onToggle={() => togglePref("pref_motivational", !motivational, setMotivational)}
        />
      </div>
    </div>
  );
}

function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmed = confirmText.trim().toUpperCase() === "DELETE";

  async function handleDelete() {
    if (!confirmed || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/user", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to delete account");
      }
      await signOut({ callbackUrl: "/" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete account");
      setDeleting(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 440, borderRadius: 20, padding: 28,
          backgroundColor: C.surfaceHigh, border: `2px solid ${C.border}`,
        }}
      >
        <h2 style={{ color: C.danger, fontFamily: "'Nunito', sans-serif", fontSize: 20, fontWeight: 900, margin: "0 0 12px" }}>
          Delete account
        </h2>
        <p style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 14, lineHeight: 1.6, margin: "0 0 8px" }}>
          This permanently deletes your account and all of your data — XP, streaks,
          lesson progress, achievements, and practice history. This cannot be undone.
        </p>
        <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 13, margin: "0 0 16px" }}>
          Type <strong style={{ color: C.text }}>DELETE</strong> to confirm.
        </p>
        <input
          value={confirmText}
          onChange={e => setConfirmText(e.target.value)}
          placeholder="DELETE"
          autoFocus
          style={{ ...INPUT, marginBottom: 16 }}
        />
        {error && (
          <p style={{ color: "#ffb4ab", fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, margin: "0 0 12px" }}>
            {error}
          </p>
        )}
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "12px 24px", borderRadius: 12, border: `2px solid ${C.border}`,
              backgroundColor: "transparent", color: C.muted,
              fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 800,
              letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!confirmed || deleting}
            style={{
              padding: "12px 24px", borderRadius: 12, border: "none",
              backgroundColor: confirmed && !deleting ? C.danger : "rgba(255,255,255,0.08)",
              color: confirmed && !deleting ? "white" : C.muted,
              fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 800,
              letterSpacing: "0.06em", textTransform: "uppercase",
              cursor: confirmed && !deleting ? "pointer" : "default",
            }}
          >
            {deleting ? "Deleting…" : "Delete Forever"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileSettings({ displayName, email }: { displayName: string; email: string }) {
  const router = useRouter();
  const initials = displayName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const [name, setName] = useState(displayName);
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const nameDirty = name.trim() !== displayName && name.trim().length > 0;
  const passDirty = newPass.length > 0 || currentPass.length > 0;
  const dirty = nameDirty || passDirty;

  async function handleSave() {
    if (!dirty || saving) return;
    setSaving(true);
    setStatus(null);
    try {
      if (nameDirty) {
        const res = await fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error ?? "Failed to update name");
        }
      }

      if (passDirty) {
        if (newPass.length < 8) {
          throw new Error("New password must be at least 8 characters");
        }
        const res = await fetch("/api/user/password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error ?? "Failed to change password");
        }
        setCurrentPass("");
        setNewPass("");
      }

      setStatus({ kind: "success", text: "Changes saved." });
      if (nameDirty) router.refresh();
    } catch (e) {
      setStatus({ kind: "error", text: e instanceof Error ? e.message : "Something went wrong" });
    } finally {
      setSaving(false);
    }
  }

  function handleExport() {
    // Navigating to the endpoint triggers the file download via
    // Content-Disposition — no client-side blob juggling needed.
    window.location.href = "/api/user/export";
  }

  return (
    <div>
      <h1 style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 24, fontWeight: 900, margin: "0 0 28px" }}>
        Profile
      </h1>

      {/* Avatar */}
      <div style={{ marginBottom: 24 }}>
        <span style={{ ...LABEL }}>Avatar</span>
        <div style={{ position: "relative", display: "inline-block" }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            backgroundColor: C.primary,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "white", fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 900 }}>
              {initials}
            </span>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={LABEL}>Name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={50}
          style={INPUT}
        />
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={LABEL}>Email</label>
        <input
          value={email}
          disabled
          style={{ ...INPUT, opacity: 0.6, cursor: "not-allowed" }}
        />
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={LABEL}>Current password</label>
        <div style={{ position: "relative" }}>
          <input
            type={showCurrent ? "text" : "password"}
            value={currentPass}
            onChange={e => setCurrentPass(e.target.value)}
            autoComplete="current-password"
            style={{ ...INPUT, paddingRight: 48 }}
          />
          <button
            onClick={() => setShowCurrent(v => !v)}
            style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: C.accent }}>
              {showCurrent ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <label style={LABEL}>New password</label>
        <div style={{ position: "relative" }}>
          <input
            type={showNew ? "text" : "password"}
            value={newPass}
            onChange={e => setNewPass(e.target.value)}
            autoComplete="new-password"
            style={{ ...INPUT, paddingRight: 48 }}
          />
          <button
            onClick={() => setShowNew(v => !v)}
            style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: C.accent }}>
              {showNew ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 40 }}>
        <SaveButton disabled={!dirty} saving={saving} onClick={handleSave} />
        <StatusMessage status={status} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start" }}>
        <button
          onClick={handleExport}
          style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", padding: 0 }}
        >
          Export my data
        </button>
        <button
          onClick={() => setShowDeleteModal(true)}
          style={{ background: "none", border: "none", cursor: "pointer", color: C.danger, fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", padding: 0 }}
        >
          Delete my account
        </button>
      </div>

      {showDeleteModal && <DeleteAccountModal onClose={() => setShowDeleteModal(false)} />}
    </div>
  );
}

function Privacy({ initial }: { initial: PrivacySettings }) {
  const router = useRouter();
  const [publicProfile, setPublicProfile] = useState(initial.publicProfile);
  const [personalizedRecs, setPersonalizedRecs] = useState(initial.personalizedRecs);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  const dirty = publicProfile !== initial.publicProfile || personalizedRecs !== initial.personalizedRecs;

  async function handleSave() {
    if (!dirty || saving) return;
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicProfile, personalizedRecs }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to save settings");
      }
      setStatus({ kind: "success", text: "Privacy settings saved." });
      router.refresh();
    } catch (e) {
      setStatus({ kind: "error", text: e instanceof Error ? e.message : "Something went wrong" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 24, fontWeight: 900, margin: "0 0 28px" }}>
        Privacy settings
      </h1>

      <ToggleRow
        label="Make my profile public"
        description="Show your name and weekly XP on the public leaderboard."
        on={publicProfile}
        onToggle={() => setPublicProfile(v => !v)}
      />
      <ToggleRow
        label="Personalized recommendations"
        description="Tailor content and suggestions based on your learning activity."
        on={personalizedRecs}
        onToggle={() => setPersonalizedRecs(v => !v)}
      />

      <div style={{ marginTop: 28 }}>
        <SaveButton disabled={!dirty} saving={saving} onClick={handleSave} />
        <StatusMessage status={status} />
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────

interface Props {
  settingsSub: string;
  displayName: string;
  email: string;
  privacy: PrivacySettings;
}

export default function Settings({ settingsSub, displayName, email, privacy }: Props) {
  return (
    <div style={{ paddingTop: 28, paddingBottom: 48 }}>
      {settingsSub === "profile" && <ProfileSettings displayName={displayName} email={email} />}
      {settingsSub === "privacy" && <Privacy initial={privacy} />}
      {settingsSub !== "profile" && settingsSub !== "privacy" && <Preferences />}
    </div>
  );
}
