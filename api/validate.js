export default async function handler(req, res) {
    // 1. CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { licenseKey } = req.body;

    if (!licenseKey) {
        return res.status(400).json({ valid: false, error: 'No key provided' });
    }

    try {
        const LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY;

        if (!LEMONSQUEEZY_API_KEY) {
            console.error("Critical: LemonSqueezy API Key missing in Vercel Env!");
            return res.status(500).json({ valid: false, error: 'Server config error' });
        }

        const licenseCheck = await fetch('https://api.lemonsqueezy.com/v1/licenses/validate', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({ 'license_key': licenseKey })
        });

        const licenseData = await licenseCheck.json();

        if (licenseCheck.ok && licenseData.valid) {
            return res.status(200).json({ valid: true, message: 'License Active' });
        } else {
            return res.status(401).json({ valid: false, error: 'Invalid Key' });
        }

    } catch (err) {
        console.error("Validation Error:", err);
        return res.status(500).json({ valid: false, error: 'Server unavailable' });
    }
}
