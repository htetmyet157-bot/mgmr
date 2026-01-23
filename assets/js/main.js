// Grab the textarea and paste button
const textarea = document.getElementById("textarea");
const pasteBtn = document.getElementById("pasteBtn");

// Paste from clipboard into textarea
pasteBtn.addEventListener("click", async () => {
  try {
    // Read text from clipboard
    const text = await navigator.clipboard.readText();
    
    if (!text) {
      alert("Clipboard is empty or contains non-text content!");
      return;
    }

    // Place text inside textarea
    textarea.value = text;

  } catch (err) {
    console.error("Failed to read clipboard:", err);
    alert("Unable to access clipboard. Make sure your browser allows clipboard access.");
  }
});


const textarea = document.getElementById("textarea");
const checkBtn = document.getElementById("checkBtn");

checkBtn.addEventListener("click", async () => {
  try {
    let text = textarea.value.trim();

    if (!text) {
      alert("Textarea is empty!");
      return;
    }

    // Optional formatting: simple cleanup
    text = text.replace(/\s+/g, " ").trim();

    // Send to backend for saving
    const res = await fetch("/save-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();

    if (data.success) {
      alert(`Text saved successfully as ${data.filename}`);
      textarea.value = data.text; // optionally display formatted text
    } else {
      alert("Failed to save text: " + (data.error || "Unknown error"));
    }
  } catch (err) {
    console.error("Check button error:", err);
    alert("Error processing text");
  }
});