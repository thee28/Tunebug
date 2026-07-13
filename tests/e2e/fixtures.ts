import { Client } from "pg";
import type { Page } from "@playwright/test";

// ---------- Note math (mirrors lib/music/notes.ts, kept dependency-free) ----
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function noteFreq(noteStr: string): number {
  const m = noteStr.match(/^([A-G]#?)(\d)$/);
  if (!m) throw new Error(`bad note ${noteStr}`);
  const midi = (parseInt(m[2]) + 1) * 12 + NOTE_NAMES.indexOf(m[1]);
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// ---------- Browser-level Web Audio / getUserMedia mock ---------------------
// Injected before any page script. The app sees a working mic whose "signal"
// is a synthetic sine wave controlled via window.__testAudio.freq (null = silence).
export const AUDIO_MOCK_INIT = `
(() => {
  window.__testAudio = { freq: null, amp: 0.5 };
  let sampleIndex = 0;
  const SAMPLE_RATE = 48000;

  class FakeAnalyser {
    constructor() { this.fftSize = 2048; }
    getFloatTimeDomainData(buf) {
      const f = window.__testAudio.freq;
      for (let i = 0; i < buf.length; i++) {
        buf[i] = f
          ? window.__testAudio.amp * Math.sin(2 * Math.PI * f * ((sampleIndex + i) / SAMPLE_RATE))
          : 0;
      }
      sampleIndex += buf.length;
    }
    // Real-AnalyserNode surface the app might touch:
    connect() {} disconnect() {}
  }

  const RealAC = window.AudioContext;
  window.AudioContext = class {
    constructor() {
      this.state = "running";
      this.sampleRate = SAMPLE_RATE;
      this.destination = {};
    }
    createAnalyser() { return new FakeAnalyser(); }
    createMediaStreamSource() { return { connect() {}, disconnect() {} }; }
    resume() { return Promise.resolve(); }
    close() { this.state = "closed"; return Promise.resolve(); }
    decodeAudioData(buf) {
      // tone.js piano samples still decode via a real offline context.
      return new RealAC().decodeAudioData(buf);
    }
  };

  navigator.mediaDevices = navigator.mediaDevices || {};
  navigator.mediaDevices.getUserMedia = async () => ({
    getTracks: () => [{ kind: "audio", readyState: "live", stop() {} }],
    getAudioTracks: () => [{ kind: "audio", readyState: "live", stop() {} }],
  });
})();
`;

export async function setSignal(page: Page, freq: number | null) {
  await page.evaluate((f) => {
    (window as unknown as { __testAudio: { freq: number | null } }).__testAudio.freq = f;
  }, freq);
}

// ---------- Direct test-DB access -------------------------------------------
export async function db<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const url = process.env.DATABASE_URL ?? "";
  if (!url.includes("tunebug_test")) throw new Error("Not the test DB — refusing");
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const res = await client.query(sql, params as never[]);
    return res.rows as T[];
  } finally {
    await client.end();
  }
}

/** Mark every lesson in beginner units BEFORE `unitOrder` as passed (no XP). */
export async function passUnitsBefore(email: string, unitOrder: number) {
  await db(
    `INSERT INTO "LessonProgress" (id, "userId", "lessonId", score, passed, attempts, "xpEarned", "completedAt")
     SELECT substr(md5(random()::text || l.id), 1, 24), u.id, l.id, 100, true, 1, 0, now()
     FROM "Lesson" l
     JOIN "Unit" un ON un.id = l."unitId"
     JOIN "Stage" s ON s.id = un."stageId"
     CROSS JOIN "User" u
     WHERE u.email = $1 AND s.order = 0 AND un.order < $2`,
    [email, unitOrder]
  );
}

// ---------- UI flows ---------------------------------------------------------
export function uniqueEmail(tag: string) {
  return `e2e-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@test.local`;
}

export const PASSWORD = "e2e-password-123";

let fakeIpCounter = 0;

/**
 * Present a unique client IP for auth endpoints so the per-IP rate limiters
 * (register: 5/15min, login: 10/15min) never bleed across tests sharing one
 * dev-server process. Dev has no reverse proxy, so x-forwarded-for is trusted.
 */
async function uniqueClientIp(page: Page) {
  // Random octets: counters reset per run, but limiter buckets in the shared
  // dev-server process live 15 minutes across runs.
  fakeIpCounter += 1;
  const ip = `10.${Math.floor(Math.random() * 200) + 1}.${Math.floor(Math.random() * 250)}.${(fakeIpCounter % 200) + 1}`;
  await page.route("**/api/auth/**", (route) =>
    route.continue({
      headers: { ...route.request().headers(), "x-forwarded-for": ip },
    })
  );
}

export async function signUp(page: Page, email: string, name = "E2E Tester") {
  await uniqueClientIp(page);
  await page.goto("/login?tab=signup");
  await page.getByPlaceholder("Your name").fill(name);
  await page.getByPlaceholder("Email or username").fill(email);
  await page.getByPlaceholder("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /^sign up$/i }).click();
  await page.waitForURL("**/onboarding**", { timeout: 15000 });
}

export async function completeOnboarding(page: Page) {
  await page.getByText("I'm new to music").click();
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByText(/casual/i).click();
  await page.getByRole("button", { name: /continue/i }).click();
  // "Start from scratch" submits directly from step 2 (no recommendation step).
  await page.getByText("Start from scratch").click();
  await page.getByRole("button", { name: /continue/i }).click();
  await page.waitForURL("**/dashboard**", { timeout: 15000 });
}

export async function logIn(page: Page, email: string) {
  await uniqueClientIp(page);
  await page.goto("/login");
  await page.getByPlaceholder("Email or username").fill(email);
  await page.getByPlaceholder("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /^log in$/i }).click();
  await page.waitForURL("**/dashboard**", { timeout: 15000 });
}

/** START badge on the lesson path (mobile+desktop layouts both render one). */
export function startBadge(page: Page) {
  return page.getByText("START", { exact: true }).first();
}

/** The active lesson node button (star icon). The START badge is decoration. */
export function activeLessonNode(page: Page) {
  return page.getByRole("button", { name: "star", exact: true }).first();
}

/**
 * Drive one on-screen PitchMatch exercise. Reads the target note from the DOM
 * ("C4 · hold for …"), sets the fake mic to that frequency (± detune cents),
 * clicks Start Singing, and waits for the exercise to resolve.
 */
export async function singCurrentExercise(page: Page, detuneCents = 0) {
  // "Start Singing" only exists in a freshly-mounted exercise's idle phase —
  // waiting for it prevents reading the PREVIOUS exercise's target note.
  await page.getByRole("button", { name: /start singing/i }).waitFor({ timeout: 15000 });
  const info = page.locator("text=/hold for/");
  const text = (await info.textContent()) ?? "";
  const match = text.match(/([A-G]#?\d)/);
  if (!match) throw new Error(`No target note in: ${text}`);
  const freq = noteFreq(match[1]) * Math.pow(2, detuneCents / 1200);
  await setSignal(page, freq);
  await page.getByRole("button", { name: /start singing/i }).click();
  if (detuneCents === 0 || Math.abs(detuneCents) <= 45) {
    await page.getByText(/nailed it/i).waitFor({ timeout: 20000 });
  } else {
    await page.getByText(/time's up/i).waitFor({ timeout: 30000 });
  }
  await setSignal(page, null);
}

/**
 * Drive a LessonRunner to its result screen: teach slides get Continue,
 * PITCH_MATCH steps get simulated in-tune singing, anything else is skipped.
 * Lesson content is slug-seeded, so pitch steps dominate the singing lessons
 * (e.g. beg-sv-1: 11 of 13 scored steps) and skips can't drag avg below 70.
 */
export async function driveLessonToCompletion(page: Page, maxSteps = 60) {
  const tryClick = async (name: RegExp) => {
    try {
      await page.getByRole("button", { name }).first().click({ timeout: 1500 });
      return true;
    } catch {
      return false;
    }
  };

  for (let i = 0; i < maxSteps; i++) {
    if (
      await page
        .getByText(/lesson complete!|keep practicing/i)
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      return;
    }
    if (
      await page
        .getByRole("button", { name: /start singing/i })
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await singCurrentExercise(page, 0);
      continue;
    }
    if (await tryClick(/^continue$/i)) continue;
    if (await tryClick(/^skip$/i)) continue;
    await page.waitForTimeout(300);
  }
  throw new Error("Lesson did not reach the result screen");
}
