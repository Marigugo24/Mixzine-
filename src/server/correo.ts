/** Envío de correo con Resend (API HTTP, sin dependencias). https://resend.com */
export const correoConfigurado = () => !!process.env.RESEND_API_KEY;

export async function enviarCorreo(para: string, asunto: string, html: string, texto: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY no configurada");
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.MAIL_FROM || "Mixzine <onboarding@resend.dev>", to: [para], subject: asunto, html, text: texto }),
  });
  if (!r.ok) throw new Error(`resend ${r.status}: ${(await r.text()).slice(0, 200)}`);
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export function correoRestablecer(nombre: string, enlace: string) {
  const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;background:#FAF5F2;border:2px solid #111">
<h1 style="margin:0 0 12px;font-size:28px">mixzine</h1>
<p>Hola ${esc(nombre)},</p>
<p>Recibimos una solicitud para restablecer tu contraseña. El enlace funciona durante 1 hora.</p>
<p style="margin:24px 0"><a href="${esc(enlace)}" style="background:#F7E34A;color:#111;padding:12px 20px;border:2px solid #111;border-radius:999px;text-decoration:none;font-weight:bold">Elegir nueva contraseña</a></p>
<p style="font-size:13px;color:#555">Si no fuiste tú, ignora este correo: tu contraseña no cambia.</p></div>`;
  const texto = `Hola ${nombre},\n\nPara restablecer tu contraseña de Mixzine entra a este enlace (vale 1 hora):\n${enlace}\n\nSi no fuiste tú, ignora este correo.`;
  return { html, texto };
}
