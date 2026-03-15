// ─── Email Templates ─────────────────────────────────────────────────────────
// All templates: German text, mobile-friendly, minimal HTML.

const BASE_STYLES = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  color: #1a1a1a;
`;

function layout(content: string, accentColor = "#6366f1"): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>StudioBase</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr>
      <td>
        <div style="${BASE_STYLES}">
          <!-- Header -->
          <div style="background:${accentColor};border-radius:12px 12px 0 0;padding:24px 32px;">
            <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.3px;">StudioBase</span>
          </div>
          <!-- Body -->
          <div style="background:#ffffff;border-radius:0 0 12px 12px;padding:32px;border:1px solid #e5e7eb;border-top:none;">
            ${content}
            <!-- Footer -->
            <hr style="border:none;border-top:1px solid #f3f4f6;margin:32px 0 24px;" />
            <p style="color:#9ca3af;font-size:12px;margin:0;line-height:1.5;">
              Dieses E-Mail wurde automatisch von StudioBase versandt.<br />
              Bitte antworte nicht direkt auf diese Nachricht.
            </p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function h1(text: string): string {
  return `<h1 style="font-size:22px;font-weight:700;margin:0 0 8px;color:#1a1a1a;">${text}</h1>`;
}

function para(text: string, muted = false): string {
  const color = muted ? "#6b7280" : "#374151";
  return `<p style="font-size:15px;line-height:1.6;color:${color};margin:0 0 16px;">${text}</p>`;
}

function infoBox(rows: [string, string][]): string {
  const cells = rows
    .map(
      ([label, value]) => `
    <tr>
      <td style="padding:10px 16px;font-size:13px;color:#6b7280;width:40%;">${label}</td>
      <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#1a1a1a;">${value}</td>
    </tr>`
    )
    .join("");
  return `
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin:0 0 24px;overflow:hidden;">
      ${cells}
    </table>`;
}

function badge(text: string, accentColor = "#6366f1"): string {
  return `<span style="display:inline-block;background:${accentColor}18;color:${accentColor};
    font-size:12px;font-weight:600;padding:4px 10px;border-radius:20px;margin-bottom:20px;">${text}</span>`;
}

// ─── Template Functions ───────────────────────────────────────────────────────

export interface BookingConfirmationParams {
  customerName: string;
  className: string;
  date: string;
  time: string;
  studio: string;
  accentColor?: string;
  logoUrl?: string;
}

export function bookingConfirmation(p: BookingConfirmationParams): string {
  const accent = p.accentColor ?? "#6366f1";
  return layout(
    `
    ${badge("Buchungsbestätigung", accent)}
    ${h1("Deine Buchung ist bestätigt!")}
    ${para(`Hallo ${p.customerName},`)}
    ${para("wir freuen uns, dass du dabei bist. Hier sind deine Buchungsdetails:")}
    ${infoBox(
      [
        ["Kurs", p.className],
        ["Datum", p.date],
        ["Uhrzeit", p.time],
        ["Studio", p.studio],
      ]
    )}
    ${para("Bitte erscheine ein paar Minuten vor Beginn des Kurses.", true)}
    ${para("Wir freuen uns auf dich!", true)}
  `,
    accent
  );
}

export interface BookingCancellationParams {
  customerName: string;
  className: string;
  date: string;
  accentColor?: string;
}

export function bookingCancellation(p: BookingCancellationParams): string {
  const accent = p.accentColor ?? "#6366f1";
  return layout(
    `
    ${badge("Buchung storniert", "#ef4444")}
    ${h1("Buchung storniert")}
    ${para(`Hallo ${p.customerName},`)}
    ${para("deine Buchung wurde erfolgreich storniert.")}
    ${infoBox(
      [
        ["Kurs", p.className],
        ["Datum", p.date],
      ]
    )}
    ${para("Wenn du innerhalb des Stornierungsfensters storniert hast, wurden deine Credits automatisch gutgeschrieben.", true)}
    ${para("Wir hoffen, dich bald wieder bei uns zu sehen!", true)}
  `,
    accent
  );
}

export interface WaitlistPromotionParams {
  customerName: string;
  className: string;
  date: string;
  time: string;
  accentColor?: string;
}

export function waitlistPromotion(p: WaitlistPromotionParams): string {
  const accent = p.accentColor ?? "#6366f1";
  return layout(
    `
    ${badge("Warteliste", "#10b981")}
    ${h1("Du hast einen Platz bekommen!")}
    ${para(`Hallo ${p.customerName},`)}
    ${para("gute Neuigkeiten! Ein Platz ist für dich freigeworden. Deine Buchung ist jetzt bestätigt.")}
    ${infoBox(
      [
        ["Kurs", p.className],
        ["Datum", p.date],
        ["Uhrzeit", p.time],
      ]
    )}
    ${para("Bitte erscheine ein paar Minuten vor Beginn des Kurses.", true)}
  `,
    accent
  );
}

export interface CreditsPurchasedParams {
  customerName: string;
  credits: number;
  expiresAt?: string | null;
  accentColor?: string;
}

export function creditsPurchased(p: CreditsPurchasedParams): string {
  const accent = p.accentColor ?? "#6366f1";
  const rows: [string, string][] = [["Credits gutgeschrieben", `${p.credits} Credits`]];
  if (p.expiresAt) {
    rows.push(["Gültig bis", p.expiresAt]);
  }
  return layout(
    `
    ${badge("Credits", accent)}
    ${h1("Credits gutgeschrieben!")}
    ${para(`Hallo ${p.customerName},`)}
    ${para("vielen Dank für deinen Kauf! Deine Credits wurden sofort gutgeschrieben.")}
    ${infoBox(rows)}
    ${para("Viel Spaß beim Buchen deiner Kurse!", true)}
  `,
    accent
  );
}

export interface WelcomeEmailParams {
  customerName: string;
  tenantName?: string;
  accentColor?: string;
}

export function welcomeEmail(p: WelcomeEmailParams): string {
  const accent = p.accentColor ?? "#6366f1";
  const studio = p.tenantName ?? "unserem Studio";
  return layout(
    `
    ${badge("Willkommen", accent)}
    ${h1(`Willkommen bei ${studio}!`)}
    ${para(`Hallo ${p.customerName},`)}
    ${para(`wir freuen uns, dich als Mitglied bei ${studio} begrüßen zu dürfen!`)}
    ${para("Du kannst jetzt Kurse buchen, dein Guthaben verwalten und deinen Kursplan einsehen.", true)}
    ${para("Viel Spaß — wir freuen uns auf dich!", true)}
  `,
    accent
  );
}
