function configured() {
  return Boolean(
    process.env.RESEND_API_KEY &&
    process.env.BUSINESS_EMAIL_FROM &&
    process.env.BUSINESS_WEB_URL,
  );
}

async function sendInvitation({ email, companyName, url, id }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    signal: AbortSignal.timeout(12000),
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `business-invitation-${id}`,
    },
    body: JSON.stringify({
      from: process.env.BUSINESS_EMAIL_FROM,
      to: email,
      subject: "Invitación a ViajaYa Business",
      text: `Te invitaron a ${companyName}. Iniciá sesión con ${email} y aceptá desde este enlace (vence en 72 horas):\n${url}\nSi no esperabas esta invitación, ignorala. El enlace es personal y de un solo uso.`,
    }),
  });
  if (!response.ok) throw new Error("mail");
}

module.exports = { configured, sendInvitation };
