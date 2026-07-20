import { Resend } from "resend";

const SUPPORT_EMAIL = "tunebugsupport@gmail.com";
// Resend requires a verified domain to use a custom "from". Until one is set up,
// their shared sender delivers to the account owner's address.
const FROM_EMAIL = process.env.FEEDBACK_FROM_EMAIL || "Tunebug Feedback <onboarding@resend.dev>";

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Email not configured" }, { status: 500 });
  }

  let body: { type?: string; message?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  if (!message) {
    return Response.json({ error: "Message is required" }, { status: 400 });
  }

  const type = body.type === "bug" ? "Bug report" : "Feedback";
  const replyTo = (body.email ?? "").trim();

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: SUPPORT_EMAIL,
    subject: `Tunebug ${type}`,
    replyTo: replyTo || undefined,
    text: [
      `Type: ${type}`,
      replyTo ? `From: ${replyTo}` : "From: (not provided)",
      "",
      message,
    ].join("\n"),
  });

  if (error) {
    return Response.json({ error: "Failed to send" }, { status: 502 });
  }

  return Response.json({ ok: true });
}
