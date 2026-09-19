// Data Models based on Case Study Constraints
const BOOTH_MAPPINGS = {
  Wina1: { location: "Lusaka CPD", services: ["Airtel Money", "MTN Money", "Zamtel Money", "Zanaco", "FNB"] },
  Wina2: { location: "Libala", services: ["Airtel Money", "MTN Money", "Zamtel Money", "FNB"] },
  Wina3: { location: "Kabwata", services: ["Airtel Money", "MTN Money", "Zamtel Money", "Zanaco", "FNB"] },
  Wina4: { location: "Mandevu", services: ["Airtel Money", "MTN Money", "Zamtel Money"] },
  Wina5: { location: "Woodlands", services: ["Airtel Money", "MTN Money", "Zanaco", "FNB"] },
  Wina6: { location: "Matero East", services: ["Airtel Money", "MTN Money", "Zamtel Money"] }
};

const SERVICE_CONFIG = {
  "Airtel Money": { rate: 0.05, limit: 350000 },
  "MTN Money": { rate: 0.06, limit: 160000 },
  "Zamtel Money": { rate: 0.045, limit: 70000 },
  "Zanaco": { rate: 0.035, limit: 80000 },
  "FNB": { rate: 0.04, limit: 80000 }
};

const TRANSACTIONS_STORAGE_KEY = "winaBwanguTransactions";
let txCounter = getStoredTransactions().length + 1;

document.addEventListener("DOMContentLoaded", () => {
  generateTransactionId();
  
  const boothSelect = document.getElementById("boothSelect");
  const serviceSelect = document.getElementById("serviceSelect");
  const form = document.getElementById("transactionForm");

  // Handle Booth Selection
  boothSelect.addEventListener("change", (e) => {
    const selectedBooth = e.target.value;
    const locationInput = document.getElementById("locationInput");
    const rateInput = document.getElementById("revenueRate");

    serviceSelect.innerHTML = '<option value="">-- Choose Service --</option>';
    rateInput.value = "";

    if (selectedBooth && BOOTH_MAPPINGS[selectedBooth]) {
      locationInput.value = BOOTH_MAPPINGS[selectedBooth].location;
      serviceSelect.disabled = false;

      // Populate matching services
      BOOTH_MAPPINGS[selectedBooth].services.forEach(service => {
        const option = document.createElement("option");
        option.value = service;
        option.textContent = service;
        serviceSelect.appendChild(option);
      });
      showToast(`Location set to ${BOOTH_MAPPINGS[selectedBooth].location}`, "success");
    } else {
      locationInput.value = "";
      serviceSelect.disabled = true;
    }
  });

  // Handle Service Selection
  serviceSelect.addEventListener("change", (e) => {
    const selectedService = e.target.value;
    const rateInput = document.getElementById("revenueRate");

    if (selectedService && SERVICE_CONFIG[selectedService]) {
      rateInput.value = SERVICE_CONFIG[selectedService].rate;
    } else {
      rateInput.value = "";
    }
  });

  // Handle Form Submission Validation
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById("transactionAmount").value);
    const service = serviceSelect.value;
    
    if (amount <= 0 || isNaN(amount)) {
      showToast("Please enter a valid positive transaction amount.", "error");
      return;
    }

    if (amount > SERVICE_CONFIG[service].limit) {
      showToast(`Transaction exceeds monthly limit of ZMW ${SERVICE_CONFIG[service].limit.toLocaleString()}`, "warning");
      return;
    }

    const transactionId = document.getElementById("transactionId").value;
    saveTransaction({
      id: transactionId,
      booth: boothSelect.value,
      location: BOOTH_MAPPINGS[boothSelect.value].location,
      service,
      amount,
      income: amount * SERVICE_CONFIG[service].rate,
      timestamp: new Date().toISOString()
    });

    // Success State
    showToast(`Transaction ${transactionId} processed successfully!`, "success");
    form.reset();
    serviceSelect.disabled = true;
    txCounter++;
    generateTransactionId();
  });
});

function getStoredTransactions() {
  try {
    return JSON.parse(localStorage.getItem(TRANSACTIONS_STORAGE_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function saveTransaction(transaction) {
  const transactions = getStoredTransactions();
  transactions.push(transaction);
  localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
}

function generateTransactionId() {
  const formattedCounter = String(txCounter).padStart(7, '0');
  document.getElementById("transactionId").value = `WB${formattedCounter}`;
}

function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}