import nodemailer from "nodemailer";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn(
      "SMTP env vars are not fully set — emails will be logged to the console instead of sent."
    );
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    family: 4,
  });
  return transporter;
}

async function send({ to, subject, html }) {
  const from = process.env.EMAIL_FROM || "Mockroom <no-reply@mockroom.app>";
  const t = getTransporter();

  if (!t) {
    // Dev fallback so the flow keeps working without real SMTP creds configured.
    console.log(`\n--- [DEV EMAIL] to:${to} subject:"${subject}" ---\n${html}\n---\n`);
    return;
  }

  await t.sendMail({ from, to, subject, html });
}

function wrapTemplate(bodyHtml) {
  return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #171a1f;">
    <div style="font-size: 20px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 24px;">
      Mockroom
    </div>
    ${bodyHtml}
    <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e6e6e6; font-size: 12px; color: #8a8f98;">
      You're receiving this because you have a Mockroom account.
    </div>
  </div>`;
}

export async function sendOtpEmail(to, code) {
  const html = wrapTemplate(`
    <p style="font-size: 15px; line-height: 1.6;">Your sign-in code is:</p>
    <div style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: 700; letter-spacing: 0.15em; background: #f4f4f4; padding: 16px 20px; border-radius: 10px; text-align: center; margin: 16px 0;">
      ${code}
    </div>
    <p style="font-size: 13px; color: #6b7280;">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
  `);
  await send({ to, subject: `${code} is your Mockroom sign-in code`, html });
}

export async function sendReportEmail(to, interview) {
  const { report, role, difficulty } = interview;
  const strengthsHtml = (report.strengths || []).map((s) => `<li>${s}</li>`).join("");
  const weaknessesHtml = (report.weaknesses || []).map((w) => `<li>${w}</li>`).join("");

  const html = wrapTemplate(`
    <p style="font-size: 15px;">Your <strong>${role}</strong> mock interview (${difficulty}) is complete.</p>
    <div style="font-size: 40px; font-weight: 700; color: #0e9488; margin: 8px 0;">${report.overallScore}<span style="font-size:16px;color:#8a8f98;">/10</span></div>
    <p style="font-size: 14px; line-height: 1.6; color: #374151;">${report.summary || ""}</p>
    <table style="width: 100%; margin-top: 20px;">
      <tr>
        <td style="vertical-align: top; width: 50%; padding-right: 12px;">
          <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #0e9488; margin-bottom: 6px;">Strengths</div>
          <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #374151;">${strengthsHtml}</ul>
        </td>
        <td style="vertical-align: top; width: 50%; padding-left: 12px;">
          <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #b45309; margin-bottom: 6px;">Focus areas</div>
          <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #374151;">${weaknessesHtml}</ul>
        </td>
      </tr>
    </table>
    <p style="font-size: 13px; color: #6b7280; margin-top: 20px;">Log back in to Mockroom to see the full question-by-question breakdown.</p>
  `);

  await send({ to, subject: `Your ${role} interview report — ${report.overallScore}/10`, html });
}
