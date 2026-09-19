const TRANSACTIONS_STORAGE_KEY = "winaBwanguTransactions";
const TAX_RATE = 0.05;
const PIE_COLORS = ["#2563eb", "#0f766e", "#f97316", "#db2777", "#7c3aed", "#0891b2"];
const BOOTH_NAMES = ["Wina1", "Wina2", "Wina3", "Wina4", "Wina5", "Wina6"];
const SERVICE_NAMES = ["Airtel Money", "MTN Money", "Zamtel Money", "Zanaco", "FNB"];

window.addEventListener("DOMContentLoaded", renderDashboard);

function renderDashboard() {
  const transactions = getStoredTransactions();
  const totalCapital = transactions.reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
  const totalIncome = transactions.reduce((total, transaction) => total + Number(transaction.income || 0), 0);

  document.getElementById("totalCapital").textContent = formatCurrency(totalCapital);
  document.getElementById("totalIncome").textContent = formatCurrency(totalIncome);
  renderFrequencyTable(transactions);
  renderBoothPieChart(transactions);
  renderTaxBars(transactions);
}

function getStoredTransactions() {
  try {
    return JSON.parse(localStorage.getItem(TRANSACTIONS_STORAGE_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function formatCurrency(value) {
  return `ZMW ${value.toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function renderFrequencyTable(transactions) {
  const content = document.getElementById("frequencyContent");

  if (transactions.length === 0) {
    content.className = "empty-state";
    content.textContent = "No transactions recorded yet.";
    return;
  }

  const boothTotals = BOOTH_NAMES.map(booth => {
    const boothTransactions = transactions.filter(transaction => transaction.booth === booth);
    const serviceCounts = SERVICE_NAMES
      .map(service => `${service}: ${boothTransactions.filter(transaction => transaction.service === service).length}`)
      .filter(item => !item.endsWith(": 0"))
      .join(", ");

    return {
      booth,
      location: boothTransactions[0]?.location || "No activity",
      total: boothTransactions.length,
      services: serviceCounts || "No services recorded"
    };
  });

  content.className = "table-wrapper";
  content.innerHTML = `
    <table class="frequency-table">
      <thead>
        <tr><th>Booth</th><th>Location</th><th>Services provided</th><th>Total</th></tr>
      </thead>
      <tbody>
        ${boothTotals.map(row => `
          <tr>
            <td>${row.booth}</td>
            <td>${row.location}</td>
            <td>${row.services}</td>
            <td>${row.total}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renderBoothPieChart(transactions) {
  const chart = document.getElementById("boothPieChart");
  const legend = document.getElementById("pieLegend");
  const counts = BOOTH_NAMES.map(booth => transactions.filter(transaction => transaction.booth === booth).length);
  const total = counts.reduce((sum, count) => sum + count, 0);

  if (total === 0) {
    chart.style.background = "#e2e8f0";
    chart.setAttribute("aria-label", "No transaction data");
    legend.innerHTML = '<span class="empty-state">No transaction data yet.</span>';
    return;
  }

  let currentAngle = 0;
  const segments = counts.map((count, index) => {
    const nextAngle = currentAngle + (count / total) * 360;
    const segment = `${PIE_COLORS[index]} ${currentAngle}deg ${nextAngle}deg`;
    currentAngle = nextAngle;
    return segment;
  }).filter((segment, index) => counts[index] > 0);

  chart.style.background = `conic-gradient(${segments.join(", ")})`;
  chart.setAttribute("aria-label", `Transaction distribution across ${total} transactions`);
  legend.innerHTML = BOOTH_NAMES.map((booth, index) => counts[index] > 0 ? `
    <div class="legend-item">
      <span class="legend-swatch" style="background: ${PIE_COLORS[index]}"></span>
      <span>${booth}: ${counts[index]} (${Math.round((counts[index] / total) * 100)}%)</span>
    </div>
  ` : "").join("");
}

function renderTaxBars(transactions) {
  const container = document.getElementById("taxBars");
  const totals = SERVICE_NAMES.map(service => {
    const income = transactions
      .filter(transaction => transaction.service === service)
      .reduce((total, transaction) => total + Number(transaction.income || 0), 0);
    return { service, tax: income * TAX_RATE };
  });
  const highestTax = Math.max(...totals.map(item => item.tax), 0);

  if (highestTax === 0) {
    container.innerHTML = '<div class="empty-state">No tax estimates available yet.</div>';
    return;
  }

  container.innerHTML = totals.map(item => {
    const width = (item.tax / highestTax) * 100;
    return `
      <div>
        <div class="bar-meta"><span>${item.service}</span><strong>${formatCurrency(item.tax)}</strong></div>
        <div class="bar-track" role="progressbar" aria-label="Estimated tax for ${item.service}" aria-valuemin="0" aria-valuemax="${highestTax}" aria-valuenow="${item.tax}">
          <div class="bar-fill" style="width: ${width}%"></div>
        </div>
      </div>
    `;
  }).join("");
}
