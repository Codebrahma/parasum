chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: "toggleSummarize" });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "summarize") {
    summarizeParagraph(request.text)
      .then((summary) => sendResponse({ summary: summary }))
      .catch((error) => sendResponse({ error: error.message }));
    return true; // Indicates we will send a response asynchronously
  }
});

async function summarizeParagraph(text) {
  const apiKey = await new Promise((resolve) => {
    chrome.storage.sync.get("apiKey", (data) => resolve(data.apiKey));
  });

  if (!apiKey) {
    throw new Error("Please set your OpenAI API key in the extension options.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that summarizes text.",
        },
        {
          role: "user",
          content: `Summarize this paragraph in one sentence: ${text}`,
        },
      ],
      max_tokens: 40,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}
