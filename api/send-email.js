export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { subject, name, email, message } = req.body;

    // Basic validation
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
        console.error('RESEND_API_KEY is not configured');
        return res.status(500).json({ error: 'Mail server not configured' });
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'TopDog Labs Support <onboarding@resend.dev>', // Resend default for unverified domains
                to: ['info@topdoglabs.com'],
                subject: `Support Request: ${subject || 'General Info'}`,
                reply_to: email,
                html: `
          <h3>New Support Request</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        `,
            }),
        });

        if (response.ok) {
            return res.status(200).json({ success: true });
        } else {
            const errorData = await response.json();
            console.error('Resend error:', errorData);
            return res.status(500).json({ error: 'Failed to send email' });
        }
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
