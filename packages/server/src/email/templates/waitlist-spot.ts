/**
 * Waitlist spot notification email template.
 * Uses plain HTML (React Email can be added later for richer templates).
 */
export function waitlistSpotTemplate(params: {
  userName: string;
  className: string;
  classDate: string;
  classTime: string;
  studioName: string;
}): { subject: string; html: string; text: string } {
  const subject = `A spot opened up in ${params.className}!`;

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Great news, ${params.userName}!</h2>
      <p>A spot has opened up and you've been automatically booked into:</p>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <strong>${params.className}</strong><br/>
        ${params.classDate} at ${params.classTime}<br/>
        ${params.studioName}
      </div>
      <p>Your credits have been deducted automatically. If you can no longer attend, please cancel in advance so others can take your spot.</p>
      <p>See you there!</p>
    </body>
    </html>
  `;

  const text = `Great news, ${params.userName}! A spot has opened up and you've been automatically booked into ${params.className} on ${params.classDate} at ${params.classTime} at ${params.studioName}. Your credits have been deducted automatically.`;

  return { subject, html, text };
}
