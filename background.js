const API_KEY = "YOUR_API_KEY"; // Replace with your actual API key

const KNOWLEDGE_BASES = {
  UPS: `Cuzor MiniUPS Specialist. 
    Models: Lite (12V 2A, 19.2Wh, 4hr), Plus (12V 2A, 28Wh, 6hr), Pro[out of stock] (12V 3A, 32Wh, 8hr), miniUPS 9v 2A (9V 2A, 5hr).
    In the box: 1x MiniUPS, 1x DC(5.5mm x 2.5mm) Cable, 1x User Manual.
    Policy: 1-year warranty replacement. ₹250 board fix for product in warranty and voltage ratings are mismatched. Doorstep battery swap program.`,

  GAN: `Cuzor Pulse 70W GaN Charger Specialist. 
    Specs: 70W Max (Single Port), 45W + 25W (Dual Port). 2x USB-C. 
    Tech: Navitas GaNSense Gen 4. Efficiency: 91%. 
    LEDs: Fast blink (Full speed), Slow glow (Nearly full), Steady (Charged). 
    Policy: 2-Year Doorstep Replacement Warranty.`
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "CALL_LLM") {
    chrome.storage.local.get(['currentMode'], (result) => {
      const mode = result.currentMode || 'UPS';
      const selectedKB = KNOWLEDGE_BASES[mode];

      const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

      // const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${API_KEY}`;
      // to use Gemini 3.1, make sure to update the model name in the URL and ensure your API key has access to that model.
      const body = {
        contents: [{ parts: [{ text: `${selectedKB}\n\nTicket: ${request.ticket}\nHint: ${request.agentHint}\n\nDraft a professional Cuzor Labs reply with a helpful tone in simple chat format:` }] }]
      };

      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })
        .then(res => res.json())
        .then(data => {
          // If we hit a 429 or a safety block, data.candidates might be undefined
          if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            const reply = data.candidates[0].content.parts[0].text;
            sendResponse({ success: true, suggestion: reply });
          } else if (data.error) {
            // This will now catch the "Rate Limit" message specifically
            sendResponse({ success: false, error: `API Error: ${data.error.message}` });
          } else {
            sendResponse({ success: false, error: "Empty response from AI. Try again in 10 seconds." });
          }
        })
        .catch(err => sendResponse({ success: false, error: err.message }));
    });
    return true;
  }
});