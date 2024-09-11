let summarizeActive = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleSummarize") {
    summarizeActive = !summarizeActive;
    if (summarizeActive) {
      processParagraphs();
    } else {
      removeSummaries();
    }
  }
});

async function processParagraphs() {
  const elements = [...document.getElementsByTagName("p")];
  for (let element of elements) {
    if (element.querySelector(".summary-div")) continue; // Skip if already processed

    // Check if the element text is empty or only contains whitespace
    if (!element.textContent.trim()) continue; // Skip empty elements

    try {
      const response = await chrome.runtime.sendMessage({
        action: "summarize",
        text: element.textContent,
      });
      if (response.error) {
        console.error("Error summarizing element:", response.error);
        continue;
      }

      // Only create and append the summary div if there's a valid summary
      if (response.summary && response.summary.trim()) {
        const div = document.createElement("div");
        div.className = "summary-div";
        div.textContent = response.summary;
        element.style.position = "relative";
        element.appendChild(div);
      }
    } catch (error) {
      console.error("Error in content script:", error);
    }
  }
}

function removeSummaries() {
  const summaries = document.querySelectorAll(".summary-div");
  summaries.forEach((summary) => summary.remove());
}
