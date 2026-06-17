"use client";

import { useState } from "react";

const C = {
  primary: "#574eb1", primaryDark: "#41379b", primaryDim: "#c5c0ff",
  surface: "var(--c-surface-alt)", surfaceHigh: "var(--c-surface-high)",
  border: "var(--c-border)", muted: "var(--c-muted)", text: "var(--c-text)",
  accent: "#574eb1",
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

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: 28, height: 28, borderRadius: 6, flexShrink: 0,
        backgroundColor: checked ? C.accent : "transparent",
        border: checked ? "none" : `2px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
      }}
    >
      {checked && (
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: "white", fontVariationSettings: "'FILL' 1" }}>
          check
        </span>
      )}
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

function CheckboxRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "16px 0", borderBottom: `1px solid ${C.border}`,
    }}>
      <span style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 600 }}>
        {label}
      </span>
      <Checkbox checked={checked} onChange={onChange} />
    </div>
  );
}

function SaveButton({ disabled }: { disabled?: boolean }) {
  return (
    <button
      disabled={disabled}
      style={{
        padding: "12px 28px", borderRadius: 12, border: "none",
        backgroundColor: disabled ? "rgba(255,255,255,0.08)" : C.primary,
        boxShadow: disabled ? "none" : `0 4px 0 0 ${C.primaryDark}`,
        color: disabled ? C.muted : "white",
        fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 800,
        letterSpacing: "0.06em", textTransform: "uppercase", cursor: disabled ? "default" : "pointer",
        transition: "background-color 0.15s",
      }}
    >
      Save Changes
    </button>
  );
}

// ── Sub-views ──────────────────────────────────────────────────────────────

function Preferences() {
  const [soundEffects, setSoundEffects] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem("pref_soundEffects");
    return stored === null ? true : stored !== "false";
  });
  const [motivational, setMotivational] = useState(true);

  function toggleSound() {
    const next = !soundEffects;
    setSoundEffects(next);
    localStorage.setItem("pref_soundEffects", String(next));
  }

  return (
    <div>
      <h1 style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 24, fontWeight: 900, margin: "0 0 28px" }}>
        Preferences
      </h1>

      <div style={{ marginBottom: 28 }}>
        <SectionHeader title="Lesson experience" />
        <ToggleRow label="Sound effects" on={soundEffects} onToggle={toggleSound} />
        <ToggleRow label="Motivational messages" on={motivational} onToggle={() => setMotivational(v => !v)} />
      </div>

    </div>
  );
}

function ProfileSettings({ displayName, email }: { displayName: string; email: string }) {
  const initials = displayName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const [name, setName] = useState(displayName);
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const dirty = name !== displayName || currentPass.length > 0;

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
          <div style={{
            position: "absolute", bottom: 0, right: 0,
            width: 22, height: 22, borderRadius: "50%",
            backgroundColor: C.accent, border: "2px solid #0F0F13",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 12, color: "white" }}>edit</span>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={LABEL}>Name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
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
        <SaveButton disabled={!dirty} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start" }}>
        <button style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Export my data
        </button>
        <button style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Delete my account
        </button>
      </div>
    </div>
  );
}

const TIMES = ["6AM", "7AM", "8AM", "9AM", "10AM", "11AM", "12PM", "1PM", "2PM", "3PM", "4PM", "5PM", "6PM", "7PM", "8PM", "9PM", "10PM"];

function Notifications() {
  const [productUpdates, setProductUpdates] = useState(true);
  const [weeklyProgress, setWeeklyProgress] = useState(true);
  const [specialPromos, setSpecialPromos] = useState(false);
  const [practiceReminder, setPracticeReminder] = useState(true);
  const [reminderTime, setReminderTime] = useState("5PM");

  return (
    <div>
      <h1 style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 24, fontWeight: 900, margin: "0 0 28px" }}>
        Notifications
      </h1>

      <div style={{ marginBottom: 28 }}>
        <SectionHeader title="General" right="Email" />
        <CheckboxRow label="Product updates + learning tips" checked={productUpdates} onChange={() => setProductUpdates(v => !v)} />
        <CheckboxRow label="Weekly progress" checked={weeklyProgress} onChange={() => setWeeklyProgress(v => !v)} />
        <CheckboxRow label="Special promotions" checked={specialPromos} onChange={() => setSpecialPromos(v => !v)} />
      </div>

      <div style={{ marginBottom: 28 }}>
        <SectionHeader title="Daily reminders" right="Email" />
        <CheckboxRow label="Practice reminder" checked={practiceReminder} onChange={() => setPracticeReminder(v => !v)} />
        {practiceReminder && (
          <div style={{ paddingTop: 14, position: "relative" }}>
            <select
              value={reminderTime}
              onChange={e => setReminderTime(e.target.value)}
              style={{ ...INPUT, appearance: "none", WebkitAppearance: "none", paddingRight: 40, cursor: "pointer" }}
            >
              {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <span className="material-symbols-outlined" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 22, color: C.muted, pointerEvents: "none" }}>
              expand_more
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function Privacy() {
  const [publicProfile, setPublicProfile] = useState(true);
  const [personalizedRecs, setPersonalizedRecs] = useState(true);
  const [dirty, setDirty] = useState(false);

  function toggle(setter: React.Dispatch<React.SetStateAction<boolean>>) {
    setter(v => !v);
    setDirty(true);
  }

  return (
    <div>
      <h1 style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 24, fontWeight: 900, margin: "0 0 28px" }}>
        Privacy settings
      </h1>

      <ToggleRow
        label="Make my profile public"
        description="Allow others to find your profile. Enrolls you in public leaderboards."
        on={publicProfile}
        onToggle={() => toggle(setPublicProfile)}
      />
      <ToggleRow
        label="Personalized recommendations"
        description="Tailor content and suggestions based on your learning activity."
        on={personalizedRecs}
        onToggle={() => toggle(setPersonalizedRecs)}
      />

      <div style={{ marginTop: 28 }}>
        <SaveButton disabled={!dirty} />
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────

interface Props {
  settingsSub: string;
  displayName: string;
  email: string;
}

export default function Settings({ settingsSub, displayName, email }: Props) {
  return (
    <div style={{ paddingTop: 28, paddingBottom: 48 }}>
      {settingsSub === "profile" && <ProfileSettings displayName={displayName} email={email} />}
      {settingsSub === "notifications" && <Notifications />}
      {settingsSub === "privacy" && <Privacy />}
      {settingsSub !== "profile" && settingsSub !== "notifications" && settingsSub !== "privacy" && <Preferences />}
    </div>
  );
}
