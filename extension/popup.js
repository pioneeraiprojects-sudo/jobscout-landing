// JobScout AI - Official Logic v1.2.5 (Vercel Backend Integrated)
let currentTone = "Balanced";
const API_ENDPOINT = "https://jobscout-landing.vercel.app/api/generate";

// Elements
const tabs = document.querySelectorAll('.tab');
const views = document.querySelectorAll('.view');
const generateBtn = document.getElementById('generateBtn');
const copyBtn = document.getElementById('copyBtn');
const saveProfile = document.getElementById('saveProfile');
const saveSamples = document.getElementById('saveSamples');
const saveKey = document.getElementById('saveKey');

const userBioInput = document.getElementById('userBioInput');
const pastWorkInput = document.getElementById('pastWorkInput');
const proposalSamplesInput = document.getElementById('proposalSamplesInput');
const apiKeyInput = document.getElementById('apiKeyInput');

const output = document.getElementById('output');
const status = document.getElementById('status');
const toneBtns = document.querySelectorAll('.tone-btn');

// --- Tab Switching ---
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const targetView = tab.getAttribute('data-view');
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        views.forEach(v => v.classList.remove('active'));
        document.getElementById(targetView).classList.add('active');
    });
});

// --- Data Loading ---
chrome.storage.local.get(['apiKey', 'userBio', 'pastWork', 'proposalSamples', 'savedTone'], (res) => {
    if (res.apiKey) apiKeyInput.value = res.apiKey;
    if (res.userBio) userBioInput.value = res.userBio;
    if (res.pastWork) pastWorkInput.value = res.pastWork;
    if (res.proposalSamples) proposalSamplesInput.value = res.proposalSamples;
    if (res.savedTone) {
        currentTone = res.savedTone;
        updateToneUI(currentTone);
    }
});

function updateToneUI(tone) {
    toneBtns.forEach(b => b.classList.remove('active'));
    const target = document.querySelector(`[data-tone="${tone}"]`);
    if (target) target.classList.add('active');
}

// --- Event Listeners ---
toneBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        currentTone = btn.getAttribute('data-tone');
        updateToneUI(currentTone);
        chrome.storage.local.set({ savedTone: currentTone });
    });
});

saveProfile.addEventListener('click', () => {
    chrome.storage.local.set({
        userBio: userBioInput.value.trim(),
        pastWork: pastWorkInput.value.trim()
    }, () => {
        flashButton(saveProfile, "EXPERIENCE SAVED!");
    });
});

saveSamples.addEventListener('click', () => {
    chrome.storage.local.set({
        proposalSamples: proposalSamplesInput.value.trim()
    }, () => {
        flashButton(saveSamples, "WRITING STYLE SAVED!");
    });
});

saveKey.addEventListener('click', () => {
    chrome.storage.local.set({ apiKey: apiKeyInput.value.trim() }, () => {
        flashButton(saveKey, "LICENSE ACTIVATED!");
    });
});

function flashButton(btn, text) {
    const originalText = btn.innerText;
    btn.innerText = text;
    setTimeout(() => btn.innerText = originalText, 2000);
}

copyBtn.addEventListener('click', () => {
    if (!output.value) return;
    output.select();
    document.execCommand('copy');
    flashButton(copyBtn, "COPIED TO CLIPBOARD!");
});

// --- Magic Generation Logic (Vercel API) ---
generateBtn.addEventListener('click', async () => {
    generateBtn.disabled = true;
    status.innerText = "Connecting to JobScout Cloud...";
    output.value = "";

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url.includes('upwork.com')) {
            throw new Error("Please use on an Upwork job page.");
        }

        const jobData = await chrome.tabs.sendMessage(tab.id, { action: "getJobData" });
        if (!jobData || !jobData.description) {
            throw new Error("Could not extract job description.");
        }

        const storage = await chrome.storage.local.get(['apiKey', 'userBio', 'pastWork', 'proposalSamples']);

        // Final Key usage: If empty, give a tip, otherwise send as licenseKey
        const licenseKey = storage.apiKey || "FREE_USER";

        status.innerText = `AI is crafting your ${currentTone} proposal...`;

        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jobDesc: jobData.description,
                userBio: `Bio: ${storage.userBio}\nPast Work: ${storage.pastWork}`,
                licenseKey: licenseKey,
                tone: currentTone,
                successMemo: storage.proposalSamples
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        output.value = data.proposal;
        status.innerText = "Crafted by JobScout Pro AI!";

    } catch (err) {
        status.innerText = "Cloud Connection Error.";
        output.value = "Error: " + err.message;
        console.error(err);
    } finally {
        generateBtn.disabled = false;
    }
});

// Periodic sync
setInterval(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (tab && tab.url.includes('upwork.com')) {
            if (status.innerText.includes("Ready") || status.innerText.includes("Waiting")) {
                status.innerText = "JobScout Cloud: Connected & Ready.";
                status.style.color = "#14a800";
            }
        }
    });
}, 3000);
