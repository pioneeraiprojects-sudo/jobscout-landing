
export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { jobDesc, userBio } = req.body;

    if (!jobDesc || !userBio) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
        return res.status(500).json({ error: 'API key not configured on server' });
    }

    const prompt = `
        You are a professional Upwork proposal writer.
        User Info: ${userBio}
        Job Description: ${jobDesc}
        
        Task: Write a high-converting, personalized Upwork proposal.
        Rules:
        - Start with a strong hook related to their problem.
        - Briefly mention why the user is the best fit.
        - Add a call to action (suggest a quick chat).
        - Keep it under 200 words.
        - Use a friendly but professional tone.
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

        if (!response.ok) {
            return res.status(response.status).json({ error: data.error?.message || 'OpenAI API Error' });
        }

        return res.status(200).json({ proposal: data.choices[0].message.content });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
}
