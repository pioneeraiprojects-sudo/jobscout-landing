// JobScout AI - Content Scraper
console.log("JobScout AI: Content script active.");

function getJobDescription() {
    // Extensive list of selectors for various Upwork layouts (Classic, AB, NX, Sliders)
    const selectors = [
        '[data-test="job-description"]',
        '.job-description',
        '.mb-20.pre-line',
        '#job-description-section',
        '.up-card-section .mb-20',
        '.description-content',
        '.fe-job-description',
        '[data-test="JobDescription"]',
        'section.job-description',
        '.up-line-clamp-v2' // Often used in lists/modals
    ];

    for (let selector of selectors) {
        const elements = document.querySelectorAll(selector);
        for (let element of elements) {
            const text = element.innerText.trim();
            // Upwork job descriptions are usually meaningful (> 50 chars)
            if (text.length > 50) {
                console.log("JobScout AI: Description found using selector: " + selector);
                return text;
            }
        }
    }

    // Fallback: If nothing found, try searching for the longest text block in a "main" card
    try {
        const cards = document.querySelectorAll('.up-card, article, section');
        let bestText = "";
        cards.forEach(card => {
            if (card.innerText.length > bestText.length) bestText = card.innerText;
        });
        if (bestText.length > 100) return bestText.substring(0, 5000); // Sanity check
    } catch (e) { }

    return null;
}

function getJobTitle() {
    const titleSelectors = [
        'h1',
        '[data-test="job-title"]',
        '.fe-job-details-header h2',
        '.up-header-title'
    ];
    for (let selector of titleSelectors) {
        const element = document.querySelector(selector);
        if (element && element.innerText.trim().length > 2) {
            return element.innerText.trim();
        }
    }
    return document.title.replace(' - Upwork', '');
}

// Communication layer
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getJobData") {
        const description = getJobDescription();
        const title = getJobTitle();
        console.log("JobScout AI: sending job data to popup.");
        sendResponse({ title, description });
    }
    return true;
});
