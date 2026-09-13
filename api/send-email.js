import { createHash } from 'node:crypto';

// Best-effort protection per warm function instance. Pair with a Vercel WAF
// rate-limit rule for limits shared across regions and cold starts (see README).
const attempts = new Map();
const windowMs = 10 * 60 * 1000;
const maxRequests = 5;
const allowedOrigins = new Set(['https://topdoglabs.com', 'https://www.topdoglabs.com']);

const consumeAttempt = (req) => {
  const now = Date.now();
  for (const [key, entry] of attempts) if (entry.expires <= now) attempts.delete(key);
  const address = (process.env.VERCEL === '1' && req.headers['x-vercel-forwarded-for']) || req.socket?.remoteAddress || 'unknown';
  const key = createHash('sha256').update(String(address)).digest('hex');
  const entry = attempts.get(key) || { count: 0, expires: now + windowMs };
  if (entry.count >= maxRequests || (!attempts.has(key) && attempts.size >= 1000)) {
    return Math.max(1, Math.ceil((entry.expires - now) / 1000));
  }
  entry.count += 1;
  attempts.set(key, entry);
  return 0;
};

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const origin = req.headers?.origin;
  const previewOrigin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
  if (origin && !allowedOrigins.has(origin) && origin !== previewOrigin) {
    return res.status(403).json({ error: 'Please use the support form on topdoglabs.com.' });
  }
  if (!req.headers?.['content-type']?.toLowerCase().startsWith('application/json')) {
    return res.status(415).json({ error: 'Send the request as JSON.' });
  }
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'Please provide your name, email, and message.' });
  }
  const limits = { name: 100, email: 254, subject: 200, message: 10000 };
  const fields = {};
  for (const [field, limit] of Object.entries(limits)) {
    const value = body[field] ?? (field === 'subject' ? 'General Support' : null);
    if (typeof value !== 'string' || !value.trim() || value.length > limit) {
      return res.status(400).json({ error: `Please enter a valid ${field} (${limit} characters maximum).`, field });
    }
    fields[field] = value.trim();
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email) || /[\r\n]/.test(fields.subject)) {
    return res.status(400).json({ error: 'Please check your email address and subject.' });
  }
  if (body.website) return res.status(200).json({ success: true });
  const retryAfter = consumeAttempt(req);
  if (retryAfter) {
    res.setHeader('Retry-After', String(retryAfter));
    return res.status(429).json({ error: 'Too many requests. Please try again in 10 minutes or email info@topdoglabs.com.' });
  }
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'The support form is temporarily unavailable. Please email info@topdoglabs.com.' });
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: AbortSignal.timeout(10000),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: process.env.SUPPORT_FROM_EMAIL || 'TopDog Labs Support <onboarding@resend.dev>',
        to: ['mbruce@topdoglabs.com'],
        subject: `Support Request: ${fields.subject}`,
        reply_to: fields.email,
        text: `New support request\n\nName: ${fields.name}\nEmail: ${fields.email}\nSubject: ${fields.subject}\n\n${fields.message}`,
      }),
    });
    if (!response.ok) {
      console.error('Support mail provider rejected request', response.status);
      return res.status(502).json({ error: 'We could not send your message. Please try again or email info@topdoglabs.com.' });
    }
    return res.status(200).json({ success: true });
  } catch {
    console.error('Support mail provider unavailable');
    return res.status(502).json({ error: 'We could not send your message. Please try again or email info@topdoglabs.com.' });
  }
}
