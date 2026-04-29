chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "GET_TICKET_DATA") {
    // 1. Try multiple possible targets
    const targets = [
      '.wrap_text',
      '.customer_message',
      '.agent_message', 
      '.ticket-content', 
      '.message-body', 
      '[data-test-id="ticket-comment"]'
    ];
    
    let capturedText = "";
    
    for (let selector of targets) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        capturedText = elements[elements.length - 1].innerText.trim();
        break; // Stop at the first match
      }
    }

    // 2. Ultimate Fallback: Grab the largest block of visible text if above fails
    if (!capturedText) {
      const mainContent = document.querySelector('main') || document.querySelector('article') || document.body;
      capturedText = mainContent.innerText.substring(0, 1500); 
    }

    sendResponse({ text: capturedText });
  } 

  if (request.action === "INJECT_REPLY") {
    const box = document.querySelector('textarea') || 
                document.querySelector('[contenteditable="true"]');
    if (box) {
      box.focus();
      document.execCommand('insertText', false, request.reply);
      sendResponse({ success: true });
    }
  }
  return true;
});