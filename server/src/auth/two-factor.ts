import { randomInt } from "node:crypto";
import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../env.js";

export const TWO_FACTOR_CODE_TTL_MINUTES = 10;

export function generateTwoFactorCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function twoFactorCodeExpiry(): Date {
  return new Date(Date.now() + TWO_FACTOR_CODE_TTL_MINUTES * 60_000);
}

// Com SMTP configurado (.env), usa ele de verdade. Sem configurar ainda,
// cai numa conta Ethereal de teste (não entrega no email real — só no
// link de preview do log). Ver AUTH.md.
let transporterPromise: Promise<Transporter> | null = null;

function getTransporter(): Promise<Transporter> {
  if (!transporterPromise) {
    if (env.smtp.host && env.smtp.user && env.smtp.pass) {
      transporterPromise = Promise.resolve(
        nodemailer.createTransport({
          host: env.smtp.host,
          port: env.smtp.port,
          secure: env.smtp.port === 465,
          auth: { user: env.smtp.user, pass: env.smtp.pass },
        }),
      );
    } else {
      transporterPromise = nodemailer.createTestAccount().then((account) =>
        nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: { user: account.user, pass: account.pass },
        }),
      );
    }
  }
  return transporterPromise;
}

export async function sendTwoFactorEmail(email: string, code: string): Promise<void> {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: env.smtp.from,
    to: email,
    subject: "Seu código de verificação — Bullet Overflow",
    text: `Seu código é ${code}. Válido por ${TWO_FACTOR_CODE_TTL_MINUTES} minutos.`,
  });
  const previewUrl = nodemailer.getTestMessageUrl(info);
  console.log(`[2FA] email enviado para ${email}${previewUrl ? ` — preview: ${previewUrl}` : ""}`);
}
