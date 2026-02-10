export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { jobDesc, userBio, licenseKey, tone, successMemo } = req.body;

    if (!jobDesc || !userBio || !licenseKey) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Verify License with Lemon Squeezy (Skip if it's a free user placeholder)
    if (licenseKey !== "FREE_USER") {
        try {
            const licenseCheck = await fetch('https://api.lemonsqueezy.com/v1/licenses/validate', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({ 'license_key': licenseKey })
            });

            const licenseData = await licenseCheck.json();

            if (!licenseCheck.ok || !licenseData.valid) {
                return res.status(401).json({ error: 'Invalid or inactive license key' });
            }
        } catch (err) {
            return res.status(500).json({ error: 'License verification error' });
        }
    }

    // 2. OpenAI API İsteği
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const prompt = `
        You are a highly skilled Upwork proposal specialist.
        
        USER BACKGROUND:
        ${userBio}
        
        SELECTED TONE: ${tone || 'Professional'}
        
        SUCCESS SAMPLE (Mimic this style):
        ${successMemo || 'Generic professional style'}

        TARGET JOB DESCRIPTION:
        ${jobDesc}
        
        TASK:
        Write a winning, personalized cover letter that mimics the USER'S SUCCESS SAMPLE style while adhering to the SELECTED TONE.
        
        STRICT RULES:
        1. Start with a customized hook that shows you've read the job description.
        2. Keep the content focused on solving the client's problem.
        3. Use the user's specific skills to justify the fit.
        4. End with a subtle call to action.
        5. Absolute Max 200 words.
        6. NO EMOJIS in the output.
    `;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7
            })
        });

        const data = await response.json();
        if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'OpenAI Error' });

        return res.status(200).json({ proposal: data.choices[0].message.content });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
}
