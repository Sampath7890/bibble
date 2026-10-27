import nodemailer from "nodemailer";
import { FEEDBACK_TYPE_OPTIONS, type FeedbackInput, type FeedbackType } from "@/lib/feedback";

const FEEDBACK_RECIPIENT =
  process.env.FEEDBACK_EMAIL?.trim() || "anshika.guleria.dev@gmail.com";

const EMAIL_SUBJECT_PREFIXES: Record<FeedbackType, string> = {
  feedback: "[Bibble Feedback]",
  bug: "[Bibble Bug Report]",
  feature: "[Bibble Feature Request]",
};

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  password?: string;
  from: string;
}

function getSmtpConfig(): SmtpConfig {
  const host = process.env.SMTP_HOST?.trim();
  if (!host) throw new Error("SMTP_HOST is not configured.");

  const port = Number(process.env.SMTP_PORT?.trim() || "587");
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_PORT is invalid.");
  }

  const user = process.env.SMTP_USER?.trim() || undefined;
  const password = process.env.SMTP_PASSWORD || undefined;
  if (Boolean(user) !== Boolean(password)) {
    throw new Error("SMTP_USER and SMTP_PASSWORD must be configured together.");
  }

  return {
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    user,
    password,
    from: process.env.SMTP_FROM?.trim() || user || "Bibble <no-reply@localhost>",
  };
}

export async function sendFeedbackEmail(feedback: FeedbackInput, submittedAt: Date): Promise<void> {
  const config = getSmtpConfig();
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth:
      config.user && config.password
        ? { user: config.user, pass: config.password }
        : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  const typeLabel =
    FEEDBACK_TYPE_OPTIONS.find((option) => option.value === feedback.type)?.label ?? "Feedback";
  const body = [
    "New feedback from Bibble",
    "",
    `Type: ${typeLabel}`,
    `Subject: ${feedback.subject}`,
    `Submitted: ${submittedAt.toISOString()}`,
    "",
    "Message:",
    feedback.message,
    "",
    "Submitted by: anonymous",
    "Identity: unavailable (Bibble has no server-side account session)",
  ].join("\n");

  try {
    const info = await transporter.sendMail({
      from: config.from,
      to: FEEDBACK_RECIPIENT,
      subject: `${EMAIL_SUBJECT_PREFIXES[feedback.type]} ${feedback.subject}`,
      text: body,
    });

    const accepted = (info.accepted ?? []).map((address) => String(address).toLowerCase());
    if (!accepted.some((address) => address.includes(FEEDBACK_RECIPIENT.toLowerCase()))) {
      throw new Error("The mail server did not accept the feedback recipient.");
    }
  } finally {
    transporter.close();
  }
}
