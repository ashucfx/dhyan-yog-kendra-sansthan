import { Resend } from "resend";
import nodemailer from "nodemailer";
import type { SubmissionRecord } from "./submissions";

export type NotificationResult = {
  sent: boolean;
  reason?: string;
  providerMessageId?: string;
};

const ADMIN_DASHBOARD_URL = "https://www.dhyanvedaglobal.org/admin/submissions";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildDetailRow(label: string, value: string, emphasize = false) {
  return `
    <tr>
      <td style="padding:12px 14px; width:180px; font-size:13px; font-weight:700; color:#6b4f3b; border-bottom:1px solid #eadfce;">
        ${escapeHtml(label)}
      </td>
      <td style="padding:12px 14px; font-size:14px; color:#2f241d; border-bottom:1px solid #eadfce; ${emphasize ? "font-weight:700;" : ""}">
        ${escapeHtml(value || "-")}
      </td>
    </tr>
  `;
}

function buildSubmissionHtml(entry: SubmissionRecord) {
  const submittedAt = new Date(entry.createdAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  });

  return `
    <div style="margin:0; padding:24px; background:#f7f0e6; font-family:Arial, Helvetica, sans-serif; color:#2f241d;">
      <div style="max-width:720px; margin:0 auto; background:#fffdfa; border:1px solid #eadfce; border-radius:20px; overflow:hidden; box-shadow:0 16px 40px rgba(76, 50, 32, 0.08);">
        <div style="padding:28px 28px 22px; background:linear-gradient(135deg, #f8e8c8 0%, #eedcc2 52%, #dfc5a4 100%); border-bottom:1px solid #e1ceb3;">
          <div style="display:inline-block; padding:6px 10px; border-radius:999px; background:rgba(255,255,255,0.72); color:#805c36; font-size:12px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase;">
            New Wellness Submission
          </div>
          <h1 style="margin:16px 0 8px; font-size:28px; line-height:1.2; color:#3a2416;">
            ${escapeHtml(entry.name)} submitted a new inquiry
          </h1>
          <p style="margin:0; font-size:15px; line-height:1.7; color:#5f4634;">
            Review the lead details below and open the admin dashboard to follow up on batch placement, wellness goals, and contact priority.
          </p>
        </div>

        <div style="padding:24px 28px 8px;">
          <div style="display:flex; flex-wrap:wrap; gap:12px; margin-bottom:20px;">
            <div style="min-width:180px; flex:1; background:#f9f4ec; border:1px solid #eadfce; border-radius:16px; padding:14px 16px;">
              <div style="font-size:12px; text-transform:uppercase; letter-spacing:0.06em; color:#8f6b47; font-weight:700;">Primary Need</div>
              <div style="margin-top:6px; font-size:18px; font-weight:700; color:#31241b;">${escapeHtml(entry.condition)}</div>
            </div>
            <div style="min-width:180px; flex:1; background:#f9f4ec; border:1px solid #eadfce; border-radius:16px; padding:14px 16px;">
              <div style="font-size:12px; text-transform:uppercase; letter-spacing:0.06em; color:#8f6b47; font-weight:700;">Batch Preference</div>
              <div style="margin-top:6px; font-size:18px; font-weight:700; color:#31241b;">${escapeHtml(entry.batchType)}</div>
            </div>
            <div style="min-width:180px; flex:1; background:#f9f4ec; border:1px solid #eadfce; border-radius:16px; padding:14px 16px;">
              <div style="font-size:12px; text-transform:uppercase; letter-spacing:0.06em; color:#8f6b47; font-weight:700;">Main Goal</div>
              <div style="margin-top:6px; font-size:18px; font-weight:700; color:#31241b;">${escapeHtml(entry.goal)}</div>
            </div>
          </div>

          <table style="border-collapse:separate; border-spacing:0; width:100%; border:1px solid #eadfce; border-radius:16px; overflow:hidden; background:#fffdfa;">
            ${buildDetailRow("Name", entry.name, true)}
            ${buildDetailRow("Country", `${entry.country} (${entry.countryCode})`)}
            ${buildDetailRow("Phone", entry.phone, true)}
            ${buildDetailRow("Email", entry.email)}
            ${buildDetailRow("Blood Group", entry.bloodGroup)}
            ${buildDetailRow("Condition", entry.condition)}
            ${buildDetailRow("Batch Type", entry.batchType)}
            ${buildDetailRow("Goal", entry.goal)}
            ${buildDetailRow("Notes", entry.notes || "-")}
            ${buildDetailRow("Submitted At", submittedAt)}
          </table>
        </div>

        <div style="padding:20px 28px 28px;">
          <a
            href="${ADMIN_DASHBOARD_URL}"
            style="display:inline-block; padding:13px 20px; border-radius:999px; background:#7c4e2d; color:#ffffff; text-decoration:none; font-size:14px; font-weight:700;"
          >
            Open Admin Dashboard
          </a>
          <p style="margin:14px 0 0; font-size:13px; line-height:1.7; color:#7a6654;">
            Dashboard link: <a href="${ADMIN_DASHBOARD_URL}" style="color:#7c4e2d; text-decoration:none;">${ADMIN_DASHBOARD_URL}</a>
          </p>
        </div>
      </div>
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
