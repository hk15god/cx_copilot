// popup.js - Cuzor Labs Support Extension
document.addEventListener('DOMContentLoaded', () => {
    const modeToggle = document.getElementById('modeToggle');
    const mainBody = document.getElementById('mainBody');
    const modeLabel = document.getElementById('modeLabel');
    const genBtn = document.getElementById('genBtn');
    const status = document.getElementById('status');
    const hintInput = document.getElementById('hintInput');

    // 1. INITIALIZE UI STATE
    // Load the last used mode (UPS or GAN) so the UI stays consistent
    chrome.storage.local.get(['currentMode'], (result) => {
        if (result.currentMode === 'GAN') {
            modeToggle.checked = true;
            updateUI(true);
        } else {
            modeToggle.checked = false;
            updateUI(false);
        }
    });

    // 2. TOGGLE LOGIC (UPS vs GAN)
    modeToggle.addEventListener('change', () => {
        const isGan = modeToggle.checked;
        updateUI(isGan);
        // Save preference so it persists across sessions
        chrome.storage.local.set({ currentMode: isGan ? 'GAN' : 'UPS' });
    });

    function updateUI(isGan) {
        mainBody.className = isGan ? 'gan-mode' : 'ups-mode';
        modeLabel.innerText = isGan ? 'Pulse 70W GaN Mode' : 'MiniUPS Mode';
        console.log(`Switched to ${isGan ? 'GAN' : 'UPS'} profile.`);
    }

    // 3. GENERATE LOGIC
    genBtn.addEventListener('click', async () => {
        status.innerText = "Connecting to page...";
        genBtn.disabled = true; // Prevent double-clicks during 429 or lag

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab) {
            status.innerText = "Error: No active tab.";
            genBtn.disabled = false;
            return;
        }

        // STEP A: Get data from the content script
        chrome.tabs.sendMessage(tab.id, { action: "GET_TICKET_DATA" }, (response) => {
            if (chrome.runtime.lastError || !response) {
                status.innerText = "REFRESH THE WORK PAGE!";
                genBtn.disabled = false;
                return;
            }

            status.innerText = "AI is thinking (Gemini 3.1 Flash)...";

            // STEP B: Send data to background.js for the LLM call
            chrome.runtime.sendMessage({
                type: "CALL_LLM",
                ticket: response.text,
                agentHint: hintInput.value
            }, (aiRes) => {
                if (aiRes && aiRes.success) {
                    status.innerText = "DONE!";
                    
                    // STEP C: Inject the AI's reply back into the page
                    chrome.tabs.sendMessage(tab.id, { 
                        action: "INJECT_REPLY", 
                        reply: aiRes.suggestion 
                    });

                    // Clear the hint for the next ticket
                    hintInput.value = "";
                } else {
                    const errorMsg = aiRes ? aiRes.error : "Unknown API Error";
                    status.innerText = "Error: " + errorMsg;
                    console.error("AI Error:", errorMsg);
                }
                
                // Re-enable button after response
                setTimeout(() => { genBtn.disabled = false; }, 1000);
            });
        });
    });
});