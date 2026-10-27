// /api/enquire.js  (Vercel / Netlify-style Node serverless function, Node 18+)
// Env vars to set on your host (never put the token in HTML or front-end JS):
//   POSTMARK_SERVER_TOKEN = your Postmark Server API token
//   ENQUIRY_TO            = bd@ardeeracquetclub.com           (optional, this is the default)
//   ENQUIRY_FROM          = bd@ardeeracquetclub.com           (must be a verified Postmark sender/domain)

const TO = process.env.ENQUIRY_TO || "bd@ardeeracquetclub.com";
const FROM = process.env.ENQUIRY_FROM || "bd@ardeeracquetclub.com";

const TITLES = {
  membership: "Membership enquiry",
  tournaments: "Tournament registration",
  events: "Private event enquiry",
  corporate: "Corporate enquiry",
  coaching: "Coaching enquiry",
};

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const token = process.env.POSTMARK_SERVER_TOKEN;
  if (!token) return res.status(500).json({ ok: false, error: "Mail is not configured" });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  // Honeypot: real people never fill this
  if (body.website) return res.status(200).json({ ok: true });

  const type = TITLES[body.form] ? body.form : null;
  const rawFields = Array.isArray(body.fields) ? body.fields.slice(0, 30) : [];
  const fields = rawFields
    .map((f) => ({
      label: String((f && f.label) || "").slice(0, 80),
      value: String((f && f.value) || "").slice(0, 2000),
    }))
    .filter((f) => f.label && f.value);

  if (!type || !fields.length) return res.status(400).json({ ok: false, error: "Invalid enquiry" });

  const find = (re) => (fields.find((f) => re.test(f.label)) || {}).value || "";
  const name = find(/name/i).slice(0, 80);
  const email = fields.find((f) => /email/i.test(f.label) && /^\S+@\S+\.\S+$/.test(f.value));
  const subject = `[ARC] ${TITLES[type]}${name ? " | " + name : ""}`.replace(/[\r\n]/g, " ");

  const textBody = fields.map((f) => `${f.label}: ${f.value}`).join("\n");
  const htmlBody =
    `<h2 style="font-family:Arial,sans-serif">${esc(TITLES[type])}</h2>` +
    `<table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">` +
    fields
      .map(
        (f) =>
          `<tr><td style="padding:6px 14px 6px 0;color:#555;vertical-align:top"><b>${esc(f.label)}</b></td>` +
          `<td style="padding:6px 0">${esc(f.value).replace(/\n/g, "<br>")}</td></tr>`
      )
      .join("") +
    `</table>`;

  const payload = {
    From: FROM,
    To: TO,
    Subject: subject,
    TextBody: textBody,
    HtmlBody: htmlBody,
    MessageStream: "outbound",
  };
  if (email) payload.ReplyTo = email.value;

  try {
    const r = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": token,
      },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const detail = await r.text();
      console.error("Postmark error", r.status, detail);
      return res.status(502).json({ ok: false, error: "Could not send" });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(502).json({ ok: false, error: "Could not send" });
  }
};