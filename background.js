// background.js
const API_KEY = "YOUR_API_KEY"; 

const CUZOR_KB = `
[Cuzor Knowledge Base]
`;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "CALL_LLM") {
    // UPDATED for 2026: Using Gemini 2.5 Flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    const promptText = `${CUZOR_KB}\n\nCustomer Ticket: ${request.ticket}\nAgent Hint: ${request.agentHint}\n\nDraft a professional reply:`;

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }]
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        const reply = data.candidates[0].content.parts[0].text;
        sendResponse({ success: true, suggestion: reply });
      } else {
        console.error("API Error Detail:", data);
        sendResponse({ success: false, error: data.error?.message || "Model error." });
      }
    })
    .catch(err => sendResponse({ success: false, error: err.message }));

    return true; 
  }
});