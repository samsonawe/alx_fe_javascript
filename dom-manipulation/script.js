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

// Save to Local Storage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Populate Categories
function populateCategories() {
  // Get unique categories
  const categories = [...new Set(quotes.map(q => q.category))];
  
  // Clear old options except "all"
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';

  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  // Restore last selected filter
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

// Show Random Quote (with category filter applied)
function showRandomQuote() {

  let filtered = quotes;
  const selected = categoryFilter.value;
  if (selected !== "all") {
    filtered = quotes.filter(q => q.category === selected);
  }

  const randomIndex = Math.floor(Math.random() * filtered.length);
  const quote = filtered[randomIndex];
  quoteDisplay.innerHTML = `"${quote.text}" — ${quote.category}`;

    // Store last viewed quote in Session Storage
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

  // Add to quotes array
  quotes.push({ text: newText, category: newCategory });
  saveQuotes(); // persist
  populateCategories(); // refresh categories

  // Reset input fields
  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";

  alert("Quote added successfully!");
}

// Export to JSON file
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

// Import from JSON file
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

// Event Listeners
newQuoteBtn.addEventListener("click", showRandomQuote);

// Initialize form on page load
createAddQuoteForm();
populateCategories();

// Restore last viewed quote (session storage)
const lastQuote = sessionStorage.getItem("lastViewedQuote");
if (lastQuote) {
  const quote = JSON.parse(lastQuote);
  quoteDisplay.textContent = `"${quote.text}" — ${quote.category}`;
}