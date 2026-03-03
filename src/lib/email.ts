import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "Sopia <hello@sopia.xyz>";

function inviteEmailHtml({
  orgName,
  role,
  inviteUrl,
}: {
  orgName: string;
  role: string;
  inviteUrl: string;
}) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're invited</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0fdfa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdfa; padding: 40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; max-width: 480px; width: 100%;">
          <!-- Header -->
          <tr>
            <td style="background-color: #0d9488; padding: 24px 32px;">
              <span style="color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">Sopia</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #18181b;">You're invited!</h1>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #374151;">
                You've been invited to join <strong>${escapeHtml(orgName)}</strong> as <strong>${escapeHtml(role)}</strong> on Sopia.
              </p>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #374151;">
                Click the button below to accept the invitation and get started.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 0 24px;">
                <tr>
                  <td style="background-color: #0d9488; border-radius: 8px;">
                    <a href="${escapeHtml(inviteUrl)}" style="display: inline-block; padding: 12px 28px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none;">Accept invitation</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 8px; font-size: 13px; line-height: 1.5; color: #6b7280;">
                This invitation expires in 7 days.
              </p>
              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #6b7280;">
                If you weren't expecting this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                Sopia &mdash; This is an automated message.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendInviteEmail({
  to,
  orgName,
  role,
  inviteUrl,
}: {
  to: string;
  orgName: string;
  role: string;
  inviteUrl: string;
}) {
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `You're invited to join ${orgName} on Sopia`,
    html: inviteEmailHtml({ orgName, role, inviteUrl }),
  });

  if (error) {
    console.error("Failed to send invite email:", error);
    return { error: error.message };
  }

  return { success: true };
}
