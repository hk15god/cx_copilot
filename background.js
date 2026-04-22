const API_KEY = "AIzaSyCTbHgFNFzpOY-pg314xxIsk752471Tm9o"; // Replace with your actual API key

const KNOWLEDGE_BASES = {
  UPS: `Cuzor MiniUPS Specialist. 
    Models: Lite (12V 2A, 19.2Wh, 4hr), Plus (12V 2A, 28Wh, 6hr), Pro (12V 3A, 32Wh, 8hr). 
    Policy: 1-year replacement. ₹250 board fix for product in warranty and power ratings are mismatched. Doorstep battery swap program.`,
  
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
        const reply = data.candidates[0].content.parts[0].text;
        sendResponse({ success: true, suggestion: reply });
      })
      .catch(err => sendResponse({ success: false, error: err.message }));
    });
    return true; 
  }
});