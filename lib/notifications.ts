import { Resend } from "resend";
import nodemailer from "nodemailer";
import type { SubmissionRecord } from "./submissions";

export type NotificationResult = {
  sent: boolean;
  reason?: string;
  providerMessageId?: string;
};

function buildSubmissionHtml(entry: SubmissionRecord) {
  return `
    <div style="font-family: Arial, sans-serif; color: #2e1a14; line-height: 1.6;">
      <h2 style="margin-bottom: 8px;">New submission received</h2>
      <p style="margin-top: 0;">A new inquiry has been submitted on the wellness website.</p>
      <table style="border-collapse: collapse; width: 100%; max-width: 720px;">
        <tr><td style="padding: 8px; font-weight: 700;">Name</td><td style="padding: 8px;">${entry.name}</td></tr>
        <tr><td style="padding: 8px; font-weight: 700;">Phone</td><td style="padding: 8px;">${entry.phone}</td></tr>
        <tr><td style="padding: 8px; font-weight: 700;">Email</td><td style="padding: 8px;">${entry.email}</td></tr>
        <tr><td style="padding: 8px; font-weight: 700;">Blood group</td><td style="padding: 8px;">${entry.bloodGroup}</td></tr>
        <tr><td style="padding: 8px; font-weight: 700;">Condition</td><td style="padding: 8px;">${entry.condition}</td></tr>
        <tr><td style="padding: 8px; font-weight: 700;">Batch type</td><td style="padding: 8px;">${entry.batchType}</td></tr>
        <tr><td style="padding: 8px; font-weight: 700;">Goal</td><td style="padding: 8px;">${entry.goal}</td></tr>
        <tr><td style="padding: 8px; font-weight: 700;">Notes</td><td style="padding: 8px;">${entry.notes || "-"}</td></tr>
        <tr><td style="padding: 8px; font-weight: 700;">Submitted at</td><td style="padding: 8px;">${entry.createdAt}</td></tr>
      </table>
    </div>
  `;
}

async function sendViaSmtp(entry: SubmissionRecord): Promise<NotificationResult> {
  const to = process.env.NOTIFICATION_EMAIL_TO;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!to || !smtpUser || !smtpPass) {
    return {
      sent: false,
      reason: "SMTP not configured. Missing NOTIFICATION_EMAIL_TO, SMTP_USER, or SMTP_PASS."
    };
  }

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = String(process.env.SMTP_SECURE || "true").toLowerCase() !== "false";
  const from = process.env.NOTIFICATION_EMAIL_FROM || smtpUser;

  try {
    const transport = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const info = await transport.sendMail({
      from,
      to,
      subject: `New wellness submission from ${entry.name}`,
      html: buildSubmissionHtml(entry)
    });

    return {
      sent: true,
      providerMessageId: info.messageId
    };
  } catch (error) {
    return {
      sent: false,
      reason: error instanceof Error ? error.message : "Unknown SMTP notification error."
    };
  }
}

async function sendViaResend(entry: SubmissionRecord): Promise<NotificationResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFICATION_EMAIL_TO;
  const from = process.env.NOTIFICATION_EMAIL_FROM;

  if (!apiKey || !to || !from) {
    return {
      sent: false,
      reason: "Missing one or more notification env variables: RESEND_API_KEY, NOTIFICATION_EMAIL_TO, NOTIFICATION_EMAIL_FROM."
    };
  }

  try {
    const resend = new Resend(apiKey);
    const response = await resend.emails.send({
      from,
      to,
      subject: `New wellness submission from ${entry.name}`,
      html: buildSubmissionHtml(entry)
    });

    const resendError = (response as { error?: { message?: string } | null }).error;
    if (resendError) {
      return {
        sent: false,
        reason: resendError.message || "Resend returned an unknown error."
      };
    }

    const providerMessageId = (response as { data?: { id?: string } | null }).data?.id;
    return {
      sent: true,
      providerMessageId
    };
  } catch (error) {
    return {
      sent: false,
      reason: error instanceof Error ? error.message : "Unknown notification error."
    };
  }
}

export async function sendSubmissionNotification(entry: SubmissionRecord): Promise<NotificationResult> {
  const smtpResult = await sendViaSmtp(entry);
  if (smtpResult.sent) {
    return smtpResult;
  }

  const resendResult = await sendViaResend(entry);
  if (resendResult.sent) {
    return resendResult;
  }

  return {
    sent: false,
    reason: `SMTP failed: ${smtpResult.reason || "unknown"} | Resend failed: ${resendResult.reason || "unknown"}`
  };
}
