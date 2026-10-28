import { hasValidationErrors, parseFeedbackInput } from "@/lib/feedback";
import { sendFeedbackEmail } from "@/lib/feedback-email";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 8_000;

function json(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const contentType = (request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    return json({ error: "Send feedback as JSON." }, 415);
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return json({ error: "We couldn't read that submission." }, 400);
  }

  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
    return json({ error: "That submission is a little too long." }, 413);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return json({ error: "We couldn't read that submission." }, 400);
  }

  const { value, errors } = parseFeedbackInput(payload);
  if (hasValidationErrors(errors)) {
    return json({ error: "Please check the highlighted fields.", fields: errors }, 400);
  }

  // Bibble has no server-side sessions yet, so no identity fields are trusted or attached.
  const submittedAt = new Date();
  try {
    await sendFeedbackEmail(value, submittedAt);
    return json({ ok: true, receivedAt: submittedAt.toISOString() }, 200);
  } catch (error) {
    console.error(
      "Feedback email could not be sent:",
      error instanceof Error ? error.message : "unknown error"
    );
    return json({ error: "We couldn't send your feedback right now. Please try again." }, 503);
  }
}
