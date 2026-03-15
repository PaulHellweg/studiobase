import nodemailer from "nodemailer";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

// ─── Transport ────────────────────────────────────────────────────────────────

/**
 * Builds a nodemailer transporter.
 * - In production: uses Resend SMTP gateway (api.resend.com:465)
 * - In development: uses Mailpit (localhost:1025 or SMTP_HOST/SMTP_PORT)
 */
function createTransporter(): nodemailer.Transporter {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not set in production");
    }
    return nodemailer.createTransport({
      host: "smtp.resend.com",
      port: 465,
      secure: true,
      auth: {
        user: "resend",
        pass: resendApiKey,
      },
    });
  }

  // Development — Mailpit or any SMTP sink
  const host = process.env.SMTP_HOST ?? "localhost";
  const port = parseInt(process.env.SMTP_PORT ?? "1025", 10);
  return nodemailer.createTransport({
    host,
    port,
    secure: false,
    // Mailpit does not require auth
    ignoreTLS: true,
  });
}

// ─── Send ─────────────────────────────────────────────────────────────────────

const FROM = process.env.EMAIL_FROM ?? "StudioBase <noreply@studiobase.app>";

/**
 * Sends a transactional email.
 * Never throws in development — logs errors instead so booking flows are not
 * interrupted by email failures.
 */
export async function sendEmail(params: SendEmailParams): Promise<void> {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
  } catch (err) {
    // Swallow email errors in all environments — email is non-critical
    console.error("[email] Failed to send email:", err);
  }
}
