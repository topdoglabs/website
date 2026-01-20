console.log('--- Support Form Submission ---');
console.log('Target Recipient:', 'mbruce@topdoglabs.com');

if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
}

const { subject, name, email, message } = req.body;
console.log('Form Data:', { subject, name, email });

// Basic validation
if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields (name, email, or message)' });
}

const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
    console.error('ERROR: RESEND_API_KEY is not defined in environment variables');
    return res.status(500).json({ error: 'Mail server configuration missing (RESEND_API_KEY)' });
}

try {
    console.log('Attempting to send via Resend...');
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
            from: 'TopDog Labs Support <onboarding@resend.dev>',
            to: ['mbruce@topdoglabs.com'], // Using signup email for sandbox testing
            subject: `Support Request: ${subject || 'General'}`,
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

    const data = await response.json();
    console.log('Resend Response API Status:', response.status);
    console.log('Resend Response Data:', data);

    if (response.ok) {
        console.log('Email sent successfully!');
        return res.status(200).json({ success: true });
    } else {
        return res.status(response.status).json({
            error: data.message || `Resend Error: ${response.statusText}`
        });
    }
} catch (error) {
    console.error('SERVER FATAL ERROR:', error);
    return res.status(500).json({ error: `Internal Server Error: ${error.message}` });
}
}
