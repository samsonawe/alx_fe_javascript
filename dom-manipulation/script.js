// Load quotes from Local Storage or fallback to defaults
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The best way to predict the future is to create it.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "Happiness depends upon ourselves.", category: "Philosophy" }
];

// DOM Elements
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const categoryFilter = document.getElementById("categoryFilter");
const syncStatus = document.getElementById("syncStatus");
const conflictsDiv = document.getElementById("conflicts");

// Save to Local Storage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Populate Categories
function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';

  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  const savedFilter = localStorage.getItem("selectedCategory");
  if (savedFilter) {
    categoryFilter.value = savedFilter;
  }
}

// Filter Quotes
function filterQuotes() {
  const selected = categoryFilter.value;
  localStorage.setItem("selectedCategory", selected);

  if (selected === "all") {
    quoteDisplay.textContent = "All quotes available. Click 'Show New Quote'!";
  } else {
    quoteDisplay.textContent = `Showing quotes from category: ${selected}. Click 'Show New Quote'!`;
  }
}

// Show Random Quote
function showRandomQuote() {
  let filtered = quotes;
  const selected = categoryFilter.value;
  if (selected !== "all") {
    filtered = quotes.filter(q => q.category === selected);
  }

  if (filtered.length === 0) {
    quoteDisplay.textContent = "No quotes available in this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filtered.length);
  const quote = filtered[randomIndex];
  quoteDisplay.innerHTML = `"${quote.text}" — ${quote.category}`;

  sessionStorage.setItem("lastViewedQuote", JSON.stringify(quote));
}

// Dynamically create Add Quote Form
function createAddQuoteForm() {
  const formContainer = document.createElement("div");

  const textInput = document.createElement("input");
  textInput.type = "text";
  textInput.id = "newQuoteText";
  textInput.placeholder = "Enter a new quote";

  const categoryInput = document.createElement("input");
  categoryInput.type = "text";
  categoryInput.id = "newQuoteCategory";
  categoryInput.placeholder = "Enter quote category";

  const addBtn = document.createElement("button");
  addBtn.innerHTML = "Add Quote";
  addBtn.addEventListener("click", addQuote);

  formContainer.appendChild(textInput);
  formContainer.appendChild(categoryInput);
  formContainer.appendChild(addBtn);

  document.body.appendChild(formContainer);
}

// Add New Quote
function addQuote() {
  const newText = document.getElementById("newQuoteText").value.trim();
  const newCategory = document.getElementById("newQuoteCategory").value.trim();

  if (!newText || !newCategory) {
    alert("Please enter both a quote and a category.");
    return;
  }

  quotes.push({ text: newText, category: newCategory });
  saveQuotes();
  populateCategories();

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";

  alert("Quote added successfully!");
}

// Export to JSON
function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Import from JSON
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (!Array.isArray(importedQuotes)) {
        alert("Invalid file format. JSON must be an array of quotes.");
        return;
      }
      quotes.push(...importedQuotes);
      saveQuotes();
      alert("Quotes imported successfully!");
    } catch (err) {
      alert("Error reading JSON file.");
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// -------------------
// Server Simulation
// -------------------
// Fetch quotes from mock server
async function fetchQuotesFromServer() {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=5");
  const data = await res.json();
  return data.map(post => ({
    text: post.title,
    category: "Server"  // placeholder category
  }));
}

async function postQuoteToServer(quote) {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(quote)
  });
  return await res.json();
}

// Conflict notifier with manual resolution
function showConflictResolution(localQuote, serverQuote, index) {
  const conflictBox = document.createElement("div");
  conflictBox.className = "conflict-box";
  conflictBox.innerHTML = `
    <p>Conflict detected for: <b>"${localQuote.text}"</b></p>
    <p>Local: "${localQuote.text}" — ${localQuote.category}</p>
    <p>Server: "${serverQuote.text}" — ${serverQuote.category}</p>
  `;

  const keepLocalBtn = document.createElement("button");
  keepLocalBtn.textContent = "Keep Local";
  keepLocalBtn.addEventListener("click", () => {
    // keep local, discard server
    conflictsDiv.removeChild(conflictBox);
  });

  const keepServerBtn = document.createElement("button");
  keepServerBtn.textContent = "Keep Server";
  keepServerBtn.addEventListener("click", () => {
    quotes[index] = serverQuote; // overwrite with server
    saveQuotes();
    populateCategories();
    conflictsDiv.removeChild(conflictBox);
  });

  conflictBox.appendChild(keepLocalBtn);
  conflictBox.appendChild(keepServerBtn);
  conflictsDiv.appendChild(conflictBox);
}

// Sync quotes with conflict detection
async function syncQuotes() {
  syncStatus.textContent = "Syncing...";
  try {
    const serverQuotes = await fetchQuotesFromServer();

    serverQuotes.forEach(sq => {
      const idx = quotes.findIndex(lq => lq.text === sq.text);
      if (idx !== -1) {
        // Conflict → ask user
        showConflictResolution(quotes[idx], sq, idx);
      } else {
        quotes.push(sq);
      }
    });

    saveQuotes();
    populateCategories();
    syncStatus.textContent = "Quotes synced with server!";
  } catch (err) {
    syncStatus.textContent = "Sync Failed!";
    console.error(err);
  }
}

// Auto-sync
let autoSyncInterval;
document.getElementById("autoSyncToggle").addEventListener("change", (e) => {
  if (e.target.checked) {
    autoSyncInterval = setInterval(syncQuotes, 30000);
  } else {
    clearInterval(autoSyncInterval);
  }
});
document.getElementById("syncNow").addEventListener("click", syncQuotes);

// -------------------
// Initialize
// -------------------
newQuoteBtn.addEventListener("click", showRandomQuote);
createAddQuoteForm();
populateCategories();

// Restore last viewed quote
const lastQuote = sessionStorage.getItem("lastViewedQuote");
if (lastQuote) {
  const quote = JSON.parse(lastQuote);
  quoteDisplay.textContent = `"${quote.text}" — ${quote.category}`;
}