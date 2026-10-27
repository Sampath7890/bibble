export const FEEDBACK_TYPES = ["feedback", "bug", "feature"] as const;

export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

export const FEEDBACK_TYPE_OPTIONS: ReadonlyArray<{ value: FeedbackType; label: string }> = [
  { value: "feedback", label: "Feedback" },
  { value: "bug", label: "Bug Report" },
  { value: "feature", label: "Feature Request" },
];

export const FEEDBACK_LIMITS = {
  subject: { min: 3, max: 120 },
  message: { min: 10, max: 2000 },
} as const;

export interface FeedbackInput {
  type: FeedbackType;
  subject: string;
  message: string;
}

export interface FeedbackFieldErrors {
  type?: string;
  subject?: string;
  message?: string;
}

export interface FeedbackParseResult {
  value: FeedbackInput;
  errors: FeedbackFieldErrors;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFeedbackType(value: string): value is FeedbackType {
  return (FEEDBACK_TYPES as readonly string[]).includes(value);
}

function normalizeSubject(value: unknown): string {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim()
    : "";
}

function normalizeMessage(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function parseFeedbackInput(input: unknown): FeedbackParseResult {
  const record = isRecord(input) ? input : {};
  const rawType = typeof record.type === "string" ? record.type.trim().toLowerCase() : "";
  const subject = normalizeSubject(record.subject);
  const message = normalizeMessage(record.message);
  const errors: FeedbackFieldErrors = {};

  if (!isFeedbackType(rawType)) {
    errors.type = "Choose Feedback, Bug Report, or Feature Request.";
  }

  if (!subject) {
    errors.subject = "Add a subject so we know what this is about.";
  } else if (subject.length < FEEDBACK_LIMITS.subject.min) {
    errors.subject = `Use at least ${FEEDBACK_LIMITS.subject.min} characters.`;
  } else if (subject.length > FEEDBACK_LIMITS.subject.max) {
    errors.subject = `Keep the subject under ${FEEDBACK_LIMITS.subject.max} characters.`;
  }

  if (!message) {
    errors.message = "Tell us a little more so we can help.";
  } else if (message.length < FEEDBACK_LIMITS.message.min) {
    errors.message = `Please add at least ${FEEDBACK_LIMITS.message.min} characters.`;
  } else if (message.length > FEEDBACK_LIMITS.message.max) {
    errors.message = `Keep the message under ${FEEDBACK_LIMITS.message.max.toLocaleString("en-US")} characters.`;
  }

  return {
    value: {
      type: isFeedbackType(rawType) ? rawType : "feedback",
      subject,
      message,
    },
    errors,
  };
}

export function hasValidationErrors(errors: FeedbackFieldErrors): boolean {
  return Boolean(errors.type || errors.subject || errors.message);
}
