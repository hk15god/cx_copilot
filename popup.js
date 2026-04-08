// popup.js
document.getElementById('genBtn').addEventListener('click', async () => {
  const status = document.getElementById('status');
  const hint = document.getElementById('hintInput').value;
  status.innerText = "Scanning page...";

  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

  chrome.tabs.sendMessage(tab.id, {action: "GET_TICKET_DATA"}, (response) => {
    if (response && response.text) {
      console.log("Captured Content:", response.text.substring(0, 100) + "...");
      status.innerText = "Consulting AI...";
      
      chrome.runtime.sendMessage({
        type: "CALL_LLM",
        ticket: response.text,
        agentHint: hint
      }, (aiRes) => {
        if (aiRes && aiRes.success) {
          status.innerText = "Success! Injected.";
          chrome.tabs.sendMessage(tab.id, { action: "INJECT_REPLY", reply: aiRes.suggestion });
        } else {
          status.innerText = "AI Error: Check Background Console";
        }
      });
    } else {
      status.innerText = "Error: Page scan failed.";
    }
  });
});